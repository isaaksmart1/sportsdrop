angular.module('service.groups', ['factory.socketconnect'])

  .service('GroupsManager', function ($state, $q, CustomUI, RemoteHTTP, Community) {

    // begin listening to changes on a chat stream
    function initChat(group, scope) {
      // fetch the community list
      scope.community = scope.communityList;
      // load the group
      groupsDB.get(group._id, {
        include_docs: true
      }).then(function (info) {
        CustomUI.renderView(info.chats, {
          scope: scope,
          chat_ls: true
        });
      }).catch(function (err) {
        // handle error
      });
      // then listen for future updates
      groupsDB.changes({
        since: 'now',
        live: true,
        include_docs: true
      }).on('change', function (changes) {
        groupChanges = filterChanges(group, changes);
        CustomUI.renderView(groupChanges, {
          scope: scope,
          chat_ls: true
        });
      }).on('error', function (err) {
        // handle error
      });
    }

    // create a new group locally and remotely (scope relative)
    function createGroup(group, scope) {
      groupsDB.get(group._id).catch(function (err) {
        // handle error
        return groupsDB.put(group);
      }).then(function (res) {
        // success
        $state.go('menu.groups');
        // invite recipients
        sendInvite(group);
        // now store remotely
        return RemoteHTTP.createOrEdit(group);
      }).then(function () {
        // broadcast id on creating the group
        LiveSocket.emit('group_id', group._id);
      });
    }

    // delete a group locally and remotely (scope relative)
    function deleteGroup(group, scope) {
      var idx = group.members.indexOf(scope.user);
      group.members.splice(idx, 1);
      groupsDB.get(group._id).then(function (group) {
        idx = group.members.indexOf(scope.user);
        group.members.splice(idx, 1);
        delete group.chats;
        RemoteHTTP.createOrEdit(group);
        return group;
      }).then(function (group) {
        // delete the group locally
        return groupsDB.remove(group);
      }).then(function () {
        // leave group
        leaveGroup({
          _id: group._id,
          name: group.name,
          user: scope.user
        });
      }).catch(function (err) {
        // handle error
      });
    }

    // send and store group message (scope relative)
    function sendStoreMsg(message, scope) {
      groupsDB.get(scope.groupInfo._id, {
        include_docs: true
      }).then(function (doc) {
        doc.chats.push(message);
        return groupsDB.put(doc, doc._rev);
      }).then(function (res) {
        LiveSocket.emit('message_send', {
          _id: scope.groupInfo._id,
          message: message
        });
        scope.messageBox.text = null;
        scope.scrollContentToBottom();
      }).catch(function (err) {});
    }

    // filter changes only for the opened group 
    function filterChanges(group, change) {
      var fltrRes = [];
      if (change.doc._id === group._id)
        fltrRes = change.doc.chats;
      return fltrRes;
    }

    // send group invitations
    function sendInvite(group) {
      LiveSocket.emit('group_invite', group);
    }

    // leave current group
    function leaveGroup(group) {
      LiveSocket.emit('leave_group', group);
    }

    return {
      chatUI: initChat,
      invite: sendInvite,
      create: createGroup,
      delete: deleteGroup,
      leave: leaveGroup,
      sendMessage: sendStoreMsg
    };
  });
