angular.module('controller.chat', [])

  .controller('ChatCtrl', function ($scope, $timeout, $ionicScrollDelegate, LocalHTTP, GroupsManager, EncryptDecrypt) {

    // set typing timeout to a second
    var TYPING_TIMER_LENGTH = 500;
    var typing = false;

    // handle user typing
    $scope.typist = "";
    $scope.typing = false;

    // scrolling to bottom handler
    $scope.scrollContentToBottom = function () {
      $timeout(function () {
        $ionicScrollDelegate.$getByHandle("chat-window").scrollBottom();
      }, 500);
    };

    // send message to group members
    $scope.sendMessage = function () {
      var encrypted = EncryptDecrypt.encrypt($scope.messageBox.text, $scope.groupInfo);
      GroupsManager.sendMessage(encrypted, $scope);
      $scope.$emit('socket:message_send');
    };

    // update the typing event
    $scope.sendTyping = function (user) {
      if (!typing) {
        typing = true;
        LiveSocket.emit('typing', {
          _id: $scope.groupInfo._id,
          typist: user
        });
      }
      lastTypingTime = (new Date()).getTime();
      $timeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          LiveSocket.emit('stopTyping', {
            _id: $scope.groupInfo._id,
            typist: user
          });
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    };

    // check for received messages
    $scope.$on('socket:message_received', function () {
      $scope.scrollContentToBottom();
    });

    // show the typing message
    LiveSocket.on('typing', function (typist) {
      if (typist !== $scope.user) {
        $scope.typing = true;
        $scope.typist = typist;
      }
    });

    // stop the typing message
    LiveSocket.on('stopTyping', function (typist) {
      if (typist !== $scope.user) {
        $scope.typing = false;
        $scope.typist = "";
      }
    });

  });
