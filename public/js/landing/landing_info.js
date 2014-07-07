/**
 * @jsx React.DOM
 */

define(['react'],
    function (React) {

  "use strict";

  var LandingInfo = React.createClass({displayName: 'LandingInfo',

    render: function() {
      return (
        <div className='landing-info'>
          <h1>Landing Info</h1>
        </div>
      );
    }
  });

  return LandingInfo;
});
