/**
 * @jsx React.DOM
 */

define(['react', 'jquery', 'jsx!users/user_info', 'jsx!users/edit_modal', 'jsx!users/delete_modal', 'jsx!game/list_view'],
    function (React, $, UserInfo, UserEditModal, UserDeleteModal, GameListView) {

  "use strict";

  var UserSingleView = React.createClass({displayName: 'UserSingleView',

    getInitialState: function() {
      return {
        userId: this.props.userId,
        firstName: this.props.firstName,
        lastName: this.props.lastName,
        email: this.props.email,
        editModalOpen: false,
        deleteModalOpen: false
      };
    },

    onUserEdit: function(user) {
      var self = this;
      $.ajax({
        type: 'PUT',
        url: '/users/' + this.state.userId,
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        success: function(updatedUser) {
          console.log(updatedUser);
          self.setState({
            userId: updatedUser.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            editModalOpen: false
          });
        },
        error: function(error) {
          console.log(error);
        }
      });
    },

    onUserDelete: function() {
      var self = this;
      $.ajax({
        type: 'DELETE',
        url: '/users/' + this.state.userId,
        success: function(updatedUser) {
          window.location = '/users';
        },
        error: function(error) {
          console.log(error);
        }
      });
    },

    openEditModal: function() {
      this.setState({editModalOpen: true});
    },

    closeEditModal: function() {
      this.setState({editModalOpen: false});
    },

    openDeleteModal: function() {
      this.setState({deleteModalOpen: true});
    },

    closeDeleteModal: function() {
      this.setState({deleteModalOpen: false});
    },

    render: function() {
      var modal = [];
      if(this.state.editModalOpen) {
        modal = <UserEditModal
          firstName={this.state.firstName}
          lastName={this.state.lastName}
          email={this.state.email}
          onUserEdit={this.onUserEdit}
          closeEditModal={this.closeEditModal}
        />
      }
      else if(this.state.deleteModalOpen) {
        modal = <UserDeleteModal
          onUserDelete={this.onUserDelete}
          closeDeleteModal={this.closeDeleteModal}
        />
      }
      return (
        <div className='user-single-view'>
          <UserInfo
            userId={this.state.userId}
            firstName={this.state.firstName}
            lastName={this.state.lastName}
            email={this.state.email}
            openEditModal={this.openEditModal}
            openDeleteModal={this.openDeleteModal}
            currentUserId={this.props.currentUserId}
          />
          { modal }
        </div>
      );
    }
  });

  return UserSingleView;
});
