/**
 * @jsx React.DOM
 */

define(['react'], function (React) {

  "use strict";

  var UserInfo = React.createClass({
    displayName: 'UserInfo',

    render: function() {
      var loggedInOptions = [];
      if(this.props.currentUserId===this.props.userId) {
        loggedInOptions = [
          <a className='user-edit' onClick={this.props.openEditModal}>Edit User</a>,
          <a className='user-delete' onClick={this.props.openDeleteModal}>Delete User</a>
        ];
      }

      return (
        <div className='user-info'>
          <h1>{this.props.firstName} {this.props.lastName}</h1>
          <h2>{this.props.email}</h2>
          { loggedInOptions }
        </div>
      );
    }

  });

  return UserInfo;
});
