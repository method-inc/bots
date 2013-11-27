require 'socket'
require 'json'

HOST = '127.0.0.1'
PORT = 1337

socket = TCPSocket.open(HOST, PORT)

socket.write 'ready'

while data=socket.gets do
  game = JSON.parse data
  puts JSON.generate game
  socket.write '[{"from":0,"to":0}]'
end

socket.close
puts 'Connection closed'
