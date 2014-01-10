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

function upload() {
  console.log('uploading bot');
  $('.success').hide();
  if (file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      console.log('Sending file...');
      var buffer = e.target.result;
      socket.emit('send-file', file.name, buffer);
      $('.success').show();
    };
    reader.readAsText(file);
  }
}
