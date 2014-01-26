var socket = io.connect(window.location.hostname);

window.onload = function() {
  submit = $('#submit');
  submit.on('click', function(e) {
    url = $("#url").val();
    e.preventDefault();
    e.stopPropagation();
    $('.success').hide();
    $('.error').hide();
    $('.waiting').show();
    socket.emit('send-url', url);
    document.location.href = '/'
  });
}

socket.on('timeout', function() {
  $('.error').html('your bot did not respond within two seconds of receiving a game state');
  $('.error').show();
  $('.waiting').hide();
})
socket.on('success', function() {
  $('.success').show();
  $('.waiting').hide();
});
