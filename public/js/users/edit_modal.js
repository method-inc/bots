/**
 * @jsx React.DOM
 */

define(['react'], function (React) {

  "use strict";

  var UserEditModal = React.createClass({
    displayName: 'UserEditModal',

    getInitialState: function () {
      return {
        firstName: this.props.firstName,
        lastName: this.props.lastName,
        email: this.props.email
      };
    },

    handleFirstNameChange: function() {
      this.setState({firstName: event.target.value});
    },

    handleLastNameChange: function() {
      this.setState({lastName: event.target.value});
    },

    handleEmailChange: function() {
      this.setState({email: event.target.value});
    },

    handleFormSubmit: function() {
      event.preventDefault();
      this.props.onUserEdit({
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        email: this.state.email
      });
    },

    render: function() {
      return (
        <div className='user-edit-modal'>
          <div className='modal-backdrop' onClick={this.props.closeEditModal}></div>
          <div className='modal-content'>
            <h1>Edit User</h1>
            <form>
              <label htmlFor='firstName'>First Name</label>
              <input type='text' name='firstName' value={this.state.firstName} onChange={this.handleFirstNameChange} />
              <label htmlFor='lastName'>Last Name</label>
              <input type='text' name='lastName' value={this.state.lastName} onChange={this.handleLastNameChange} />
              <label htmlFor='email'>Email</label>
              <input type='text' name='email' value={this.state.email} onChange={this.handleEmailChange} />
              <input type='submit' onClick={this.handleFormSubmit} />
            </form>
          </div>
        </div>
      );
    }

  });

  return UserEditModal;
});
