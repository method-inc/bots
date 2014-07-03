/**
 * @jsx React.DOM
 */
'use strict';
require(['jsx!users/single_view', 'react'], function(UserSingleView, React) {
    var userId = document.getElementById('user-id').value;
    var firstName = document.getElementById('user-firstname').value;
    var lastName = document.getElementById('user-lastname').value;
    var email = document.getElementById('user-email').value;
    console.log(firstName);
    React.renderComponent(
      UserSingleView({
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        email: email
      }),
      document.getElementById('profile')
    );
});
