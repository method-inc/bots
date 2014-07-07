/**
 * @jsx React.DOM
 */
'use strict';
require(['react', 'jsx!landing/landing_view'],
      function(React, LandingView) {
    var currentUserId = document.getElementById('current-user-id').value;
    React.renderComponent(
      LandingView({currentUserId: currentUserId}),
      document.getElementById('landing')
    );
});
