/**
 * @jsx React.DOM
 */

define(['react', 'jsx!landing/landing_info', 'jsx!users/login_panel', 'jsx!users/signup_panel'],
    function (React, LandingInfo, LoginPanel, SignupPanel) {

  "use strict";

  var LandingView = React.createClass({displayName: 'LandingView',

    onLogin: function() {
    },

    onSignup: function() {
    },

    render: function() {
      var landingPageTop = <h1>Logged in</h1>
      if(this.props.currentUserId === '') {
        landingPageTop = [
          <LoginPanel onLogin={this.onLogin} />,
          <SignupPanel onSignup={this.onSignup} />
        ];
      }

      return (
        <div className='landing-view'>
          { landingPageTop }
          <LandingInfo />
        </div>
      );
    }
  });

  return LandingView;
});
