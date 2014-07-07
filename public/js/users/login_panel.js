/**
 * @jsx React.DOM
 */

define(['react'],
    function (React) {

  "use strict";

  var LoginPanel = React.createClass({displayName: 'LoginPanel',

    render: function() {
      return (
        <div className='login-panel'>
          <h1>Login panel</h1>
        </div>
      );
    }
  });

  return LoginPanel;
});
