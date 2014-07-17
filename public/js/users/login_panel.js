/**
 * @jsx React.DOM
 */

define(['react'],
    function (React) {

  "use strict";

  var LoginPanel = React.createClass({displayName: 'LoginPanel',

    getInitialState: function () {
      return {
        email: '',
        password: ''
      };
    },

    handleEmailChange: function() {
      this.setState({email: event.target.value});
    },

    handlePasswordChange: function() {
      this.setState({password: event.target.value});
    },

    handleFormSubmit: function() {
      event.preventDefault();
      this.props.onLogin({
        email: this.state.email,
        password: this.state.password
      });
    },

    render: function() {
      return (
        <div className='login-panel'>
          <h2>Login</h2>
          <form>
            <label htmlFor='email'>Email</label>
            <input type='email' name='email' value={this.state.email} onChange={this.handleEmailChange} />
            <label htmlFor='password'>Password</label>
            <input type='password' name='password' value={this.state.password} onChange={this.handlePasswordChange} />
            <input type='submit' value='Login' onClick={this.handleFormSubmit} />
          </form>
        </div>
      );
    }
  });

  return LoginPanel;
});
