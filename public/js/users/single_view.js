/**
 * @jsx React.DOM
 */

define(['react', 'jsx!users/user_info', 'jsx!game/list_view'],
    function (React, UserInfo, GameListView) {

  "use strict";

  var UserSingleView = React.createClass({displayName: 'UserSingleView',

    getInitialState: function() {
      return {
        userId: this.props.userId,
        firstName: this.props.firstName,
        lastName: this.props.lastName,
        email: this.props.email
      };
    },

    onUserEdit: function() {
    },

    onUserDelete: function() {
    },

    render: function() {
      return (
        <div className='user-single-view'>
          <UserInfo firstName={this.props.firstName} lastName={this.props.lastName} email={this.props.email} onUserEdit={this.onUserEdit} />
        </div>
      );
    }
  });

  return UserSingleView;
});
