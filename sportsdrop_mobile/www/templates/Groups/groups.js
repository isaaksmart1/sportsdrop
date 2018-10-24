angular.module('controller.groups', ['controller.chat', 'service.groups', 'service.community'])

  .controller('GroupCtrl', function ($rootScope, $scope, $filter, $timeout,
    CustomUI, GroupsManager, PouchDBListener, LocalHTTP, Community, Facebook) {

    $scope.search = {};
    $scope.user = LocalHTTP.userName();
    $scope.group = {
      name: '',
      caption: ''
    };

    // search through list of available groups
    $scope.searchGroups = function (referenceList) {
      var list = referenceList;
      var filterRes = [];
      list.forEach(function (data) {
        if (data) {
          var fltr = $filter('uppercase')($scope.search.res);
          var feed = $filter('uppercase')(data.name);
          if (feed.indexOf(fltr) >= 0)
            filterRes.push(data);
        }
      });
      return filterRes;
    };

    // create a new group
    $scope.newGroup = function () {
      // make api call to FB for friends list (request explicit granted permission)
      Facebook.getLoginStatus().then(function (result) {
        if (result.status === 'connected') {
          return Facebook.graphAPI({
            edge: 'permissions'
          });
        }
      }).then(function (res) {
        // handle result
        return Facebook.graphAPI({
          edge: 'friends'
        });
      }).then(function (res) {
        // handle success
      }).catch(function (res) {
        // handle error
      });

      // generate a unique group id
      var id = new Date();
      var memberNames = [];
      $scope.chats = [];
      $scope.memberList = [];

      // add members to the group
      $scope.addMember = function (person) {
        var idx = $scope.persons.indexOf(person);
        // make sure the user cannot add the same member more than once
        if ($scope.memberList.indexOf(person.name) < 0) {
          $scope.memberList.push(person);
          memberNames.push(person.name);
          $scope.persons.splice(idx, 1);
        } else return;
      };

      // remove members from the group
      $scope.removeMember = function (member) {
        var idx = $scope.memberList.indexOf(member);
        // sanity check to ensure member is indeed in the list before removal
        if (idx >= 0) {
          $scope.memberList.splice(idx, 1);
          memberNames.splice(idx, 1);
          $scope.persons.push(member);
        } else return;
      };

      // confirm group information
      $scope.goConfirm = function () {

        // cannot create empty groups
        if ($scope.memberList.length <= 0) {
          CustomUI.toaster('You must add at least 1 person', 2000);
          return false;
        }

        // show the confirm group view
        CustomUI.modalView('templates/Groups/pages/new-group/confirm-group.html', $scope);

        // confirm group information
        $scope.clickOK = function () {
          if ($scope.group.name === '') {
            CustomUI.toaster('You must add a group name', 2000);
            return false;
          }
          memberNames.push($scope.user);
          var newGroup = {
            _id: id.toJSON(),
            admin: $scope.user,
            caption: $scope.group.caption,
            chats: $scope.chats,
            members: memberNames,
            name: $scope.group.name,
            size: memberNames.length,
          };
          GroupsManager.create(newGroup, $scope);
        };
      };

      // retrieve users community
      $scope.community();
    };

    // open existing group to start chat service
    $scope.openGroup = function (group) {

      // assign group information to local scope
      $scope.groupInfo = group;

      // populate chat list with user messages
      $scope.messages = [];
      $scope.messageBox = {};

      // initialize chat feed for the current group
      GroupsManager.chatUI($scope.groupInfo, $scope);

      // show the modal view
      CustomUI.modalView('templates/Groups/pages/chat/chat.html', $scope);

      // broadcast id on opening the chat window
      LiveSocket.emit('group_id', group._id);

      // --- TODOS --- //
      // add new member to group (must be group leader)
      // delete member from group (must be group leader)
      // leave group
    };

    // delete a group
    $scope.deleteGroup = function (group) {
      CustomUI.actionButton('Delete Group ?').then(function (res) {
        if (res) {
          // sanity check to see if group is in the list
          if ($scope.groups.indexOf(group) > -1)
            GroupsManager.delete(group, $scope);
          else throw false;
        }
      }).catch(function (err) {
        // handle error
      });
    };

    // display all groups to the user
    $scope.updateGroupsList = function () {
      // synchronise local database to UI
      PouchDBListener.listen(groupsDB, CustomUI.renderView, {
        scope: $scope,
        group_ls: true
      });
    };

    // check for group invitations
    $scope.$on('socket:group_invitation', function (e, data) {
      // broadcast id on receiving the invite
      LiveSocket.emit('group_id', data._id);
    });

    // check for users who have left the group
    $scope.$on('socket:left_group', function (e, data) {
      if ($scope.groupInfo) {
        var idx = $scope.groupInfo.members.indexOf(data.user);
        $scope.groupInfo.members.splice(idx, 1);
      }
      CustomUI.toaster(data.user + ' has left ' + data.name, 2000);
    });

    // populate list of names from the community
    $scope.community = function () {
      Community.data().then(function (list) {
        $scope.communityList = list;
        community($scope.communityList);
      });
    };

    // retrieve list of people from the community
    community = function (communityList) {
      CustomUI.showSpinner($rootScope.platformID);
      // make api call to FB for friends list (request explicit granted permission)
      Facebook.getLoginStatus().then(function (result) {
        if (result.status === 'connected') {
          return Facebook.graphAPI({
            edge: 'permissions'
          });
        }
      }).then(function (res) {
        // handle result
        return Facebook.graphAPI({
          edge: 'friends'
        });
      }).then(function (res) {
        // handle success
      }).catch(function (res) {
        // handle error
      });

      // make api call to SD community
      Community.call($scope.user, communityList).then(function (list) {
        CustomUI.hideSpinner();
        $scope.persons = $scope.communityList = list;
      }).catch(function (err) {
        CustomUI.hideSpinner();
      });

      // block person from your community
      $scope.blockPerson = function (person) {
        var confirm = CustomUI.actionButton('Are you sure ?');
        confirm.then(function (res) {
          if (res) {
            var idx = $scope.communityList.getIndexBy("name", person.name);
            if (idx > NODATA) {
              $scope.communityList[idx].blocked = true;
              $scope.persons = $scope.communityList;
            }
          } else
            return;
        });
      };

      // unblock person from your community
      $scope.unBlockPerson = function (person) {
        var idx = $scope.communityList.getIndexBy("name", person.name);
        if (idx > NODATA) {
          $scope.communityList[idx].blocked = false;
          $scope.persons = $scope.communityList;
        }
      };
    };
    $scope.community();
  });
