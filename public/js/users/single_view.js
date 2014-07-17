/**
 * @jsx React.DOM
 */

define(['react', 'jquery', 'jsx!users/user_info', 'jsx!users/edit_modal', 'jsx!game/list_view'],
    function (React, $, UserInfo, UserEditModal, GameListView) {

  "use strict";

  var UserSingleView = React.createClass({displayName: 'UserSingleView',

    getInitialState: function() {
      return {
        userId: this.props.userId,
        firstName: this.props.firstName,
        lastName: this.props.lastName,
        email: this.props.email,
        editModalOpen: false
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
    },

    openEditModal: function() {
      this.setState({editModalOpen: true});
      console.log('edit modal opened');
    },

    closeEditModal: function() {
      this.setState({editModalOpen: false});
      console.log('edit modal closed');
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
      return (
        <div className='user-single-view'>
          <UserInfo
            firstName={this.state.firstName}
            lastName={this.state.lastName}
            email={this.state.email}
            openEditModal={this.openEditModal}
          />
          { modal }
        </div>
      );
    }
  });

  return UserSingleView;
});
