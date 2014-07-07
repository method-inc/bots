/**
 * @jsx React.DOM
 */

define(['react'],
    function (React) {

  "use strict";

  var SignupPanel = React.createClass({displayName: 'SignupPanel',

    getInitialState: function () {
      return {
        firstName: '',
        lastName: '',
        email: '',
        password: ''
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

    handlePasswordChange: function() {
      this.setState({password: event.target.value});
    },

    handleFormSubmit: function() {
      event.preventDefault();
      this.props.onSignup({
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        email: this.state.email,
        password: this.state.password
      });
    },

    render: function() {
      return (
        <div className='signup-panel'>
          <h2>Signup</h2>
          <form>
            <label htmlFor='firstName'>First Name</label>
            <input type='text' name='firstName' value={this.state.firstName} onChange={this.handleFirstNameChange} />
            <label htmlFor='lastName'>Last Name</label>
            <input type='text' name='lastName' value={this.state.lastName} onChange={this.handleLastNameChange} />
            <label htmlFor='email'>Email</label>
            <input type='email' name='email' value={this.state.email} onChange={this.handleEmailChange} />
            <label htmlFor='password'>Password</label>
            <input type='password' name='password' value={this.state.password} onChange={this.handlePasswordChange} />
            <input type='submit' value='Signup' onClick={this.handleFormSubmit} />
          </form>
        </div>
      );
    }
  });

  return SignupPanel;
});
