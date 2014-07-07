/**
 * @jsx React.DOM
 */

define(['react'], function (React) {

  "use strict";

  var UserInfo = React.createClass({
    displayName: 'UserInfo',

    render: function() {
      return (
        <div className='user-info'>
          <h1>{this.props.firstName} {this.props.lastName}</h1>
          <h2>{this.props.email}</h2>
        </div>
      );
    }

  });

  return UserInfo;
});
