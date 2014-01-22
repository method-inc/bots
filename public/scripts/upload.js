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

  fileDropzone = $('#bot-file-dropzone');
  fileDropzone.on('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  fileDropzone.on('dragenter', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  fileDropzone.on('drop', function(e){
    if(e.originalEvent.dataTransfer){
      if(e.originalEvent.dataTransfer.files.length) {
        e.preventDefault();
        e.stopPropagation();
        file = e.originalEvent.dataTransfer.files[0];
        upload();
      }   
    }
  });
}

socket.on('crash', function(data) {
  $('.error').html('your bot crashed: ' + data);
  $('.error').show();
  $('.waiting').hide();
});
socket.on('timeout', function() {
  $('.error').html('your bot did not respond within two seconds of receiving a game state');
  $('.error').show();
  $('.waiting').hide();
})
socket.on('success', function() {
  $('.success').show();
  $('.waiting').hide();
});

function upload() {
  console.log('uploading bot');
  $('.success').hide();
  $('.error').hide();
  $('.waiting').show();
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
