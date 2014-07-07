/**
 * @jsx React.DOM
 */

define(['react', 'jquery', 'jsx!landing/landing_info', 'jsx!users/login_panel', 'jsx!users/signup_panel'],
    function (React, $, LandingInfo, LoginPanel, SignupPanel) {

  "use strict";

  var LandingView = React.createClass({displayName: 'LandingView',

    getInitialState: function () {
      return {
        currentUserId: this.props.currentUserId
      };
    },

    onLogin: function(user) {
      var self = this;
      $.ajax({
        type: 'POST',
        url: '/login',
        data: {
          email: user.email,
          password: user.password
        },
        success: function(user) {
          console.log(user);
          self.setState({currentUserId: user.id});
        },
        error: function(error) {
          console.log(error);
        }
      });
    },

    onLogout: function() {
      event.preventDefault();
      var self = this;
      $.ajax({
        type: 'GET',
        url: '/logout',
        success: function(newUser) {
          self.setState({currentUserId: ''});
        }
      });
    },

    onSignup: function(user) {
      var self = this;
      $.ajax({
        type: 'POST',
        url: '/users',
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password
        },
        success: function(newUser) {
          console.log(newUser);
          self.setState({currentUserId: newUser.id});
        },
        error: function(error) {
          console.log(error);
        }
      });
    },

    render: function() {
      var landingPageTop = [
        <h2>Logged in {this.state.currentUserId}</h2>,
        <a href='/logout' onClick={this.onLogout}>Logout</a>
      ];
      if(this.state.currentUserId === '') {
        landingPageTop = [
          <LoginPanel onLogin={this.onLogin} />,
          <SignupPanel onSignup={this.onSignup} />
        ];
      }

      return (
        <div className='landing-view'>
          <h1>Bot Wars</h1>
          { landingPageTop }
          <LandingInfo />
        </div>
      );
    }
  });

  return LandingView;
});
