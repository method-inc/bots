/**
 * @jsx React.DOM
 */

define(['react'],
    function (React) {

  "use strict";

  var SignupPanel = React.createClass({displayName: 'SignupPanel',

    render: function() {
      return (
        <div className='signup-panel'>
          <h1>Signup panel</h1>
        </div>
      );
    }
  });

  return SignupPanel;
});
