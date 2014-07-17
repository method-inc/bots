/**
 * @jsx React.DOM
 */

define(['react'], function (React) {

  "use strict";

  var UserDeleteModal = React.createClass({
    displayName: 'UserDeleteModal',

    handleFormSubmit: function() {
      event.preventDefault();
      this.props.onUserDelete();
    },

    render: function() {
      return (
        <div className='user-delete-modal'>
          <div className='modal-backdrop' onClick={this.props.closeDeleteModal}></div>
          <div className='modal-content'>
            <h1>Delete User</h1>
            <form>
              <p>Are you sure you want to delete this user?</p>
              <input type='submit' value='yes' onClick={this.handleFormSubmit} />
              <input type='button' value='no' onClick={this.props.closeDeleteModal} />
            </form>
          </div>
        </div>
      );
    }

  });

  return UserDeleteModal;
});
