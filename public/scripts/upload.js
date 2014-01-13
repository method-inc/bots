var socket = io.connect(window.location.hostname);
var file;

window.onload = function() {
  filesUpload = $('#bot-file')[0];
  filesUpload.addEventListener('change', function(e) {
    var files = e.target.files || e.dataTransfer.files;
    if (files) {
      file = files[0];
      console.log(file);
      upload();
      $(filesUpload).val('');
    }
  }, false);
}

socket.on('crash', function(data) {
  $('.error').html('your bot crashed: ' + data);
  $('.error').show();
});
socket.on('timeout', function() {
  $('.error').html('your bot did not respond within two seconds of receiving a game state');
  $('.error').show();
})
socket.on('success', function() {
  $('.success').show();
});

function upload() {
  console.log('uploading bot');
  $('.success').hide();
  $('.error').hide();
  if (file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      console.log('Sending file...');
      var buffer = e.target.result;
      socket.emit('send-file', file.name, buffer);
    };
    reader.readAsText(file);
  }
}
