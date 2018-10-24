require('../api/globals').extends(Array);
var socketio = require('socket.io');
var config = require('../models/database');

// hold list of connected sockets
var clientsDB = config.clients;
var temp = [];

// find list of clients and thier socket id's
function findNames(arr) {
    var res = [];
    // fetch names from the database
    for (var i = 0; i < arr.length; i++) {
        if (arr[i])
            res.push(temp[temp.getIndexBy("name", arr[i])]);
    }
    return res;
};

module.exports.listen = function (app) {

    // connect io port to server
    io = socketio.listen(app);
    // io.set('origins', '*:*');

    // handle users connecting
    io.sockets.on('connection', function (socket) {

        // default: store socket id on connection
        var name = socket.handshake.query.name;
        if (temp.getIndexBy("name", name) > -1) {
            temp[temp.getIndexBy("name", name)].id = socket.id;
            // temp.sync(clientsDB);
        } else {
            temp.push({
                name: name,
                id: socket.id
            });
            // temp.sync(clientsDB);
        };

        // link client socket to the room of the group
        socket.on('group_id', function (id) {
            socket.join(id);
        });

        // handle sending messages from host to client(s)
        socket.on('message_send', function (data) {
            if (data._id) {
                socket.broadcast.to(data._id).emit('message_received', data);
            };
        });

        // handle group invitations from host to client(s)
        socket.on('group_invite', function (data) {
            var invites = findNames(data.members);
            if (data._id) {
                invites.forEach(function (invitatee) {
                    // send room key to individual socket id's
                    if (invitatee)
                        socket.broadcast.to(invitatee.id).emit('group_invitation', data);
                });
            };
        });

        // handle group leavings
        socket.on('leave_group', function (data) {
            if (data._id) {
                socket.leave(data._id);
                socket.broadcast.to(data._id).emit('left_group', data);
            };
        });

        // link host socket to the activity
        socket.on('activity_id', function (id) {
            socket.join(id);
        });

        // handle joining an activity
        socket.on('join_activity', function (data) {
            if (data._id) {
                socket.join(data._id);
                socket.broadcast.to(data._id).emit('player_joined', data);
            };
        });

        // handle leaving an activity
        socket.on('leave_activity', function (data) {
            if (data._id) {
                socket.leave(data._id);
                socket.broadcast.to(data._id).emit('player_left', data);
            };
        });

        // handle activity invitations from host to client(s)
        socket.on('activity_invitations', function (data) {
            var invites = findNames(data.accepted);
            var rejects = findNames(data.rejected);
            if (data._id) {
                invites.forEach(function (invitatee) {
                    // send invitations to individual socket id's
                    if (invitatee)
                        socket.broadcast.to(invitatee.id).emit('player_invited', data);
                });
                rejects.forEach(function (rejectee) {
                    // send rejections to individual socket id's
                    if (rejectee)
                        socket.broadcast.to(rejectee.id).emit('player_rejected', data);
                });
            };
        });

        // send typing indicator to clients
        socket.on('typing', function (data) {
            if (data._id) {
                socket.broadcast.to(data._id).emit('typing', data.typist);
            };
        });

        // send stop typing indicator to clients
        socket.on('stopTyping', function (data) {
            if (data._id) {
                socket.broadcast.to(data._id).emit('stopTyping', data.typist);
            };
        });

        // handle users disconnecting
        socket.on("disconnect", function () {
            var i = temp.getIndexBy("id", socket.id);
            temp.splice(i, 1);
        });
    });

    // return io object
    return io;
};