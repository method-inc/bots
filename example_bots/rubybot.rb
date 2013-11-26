require 'socket'
require 'json'

HOST = '127.0.0.1'
PORT = 1337

socket = TCPSocket.open(HOST, PORT)

socket.write 'ready'

while data=socket.gets do
  puts data.chop
  # state = JSON.parse(socket.gets)

  # puts 'RECEIVED DATA: ' + state['grid'].to_s
  socket.write '[{"from":0,"to":0}]'
end

socket.close
puts 'Connection closed'
