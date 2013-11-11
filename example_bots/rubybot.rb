require 'socket'

HOST = '127.0.0.1'
PORT = 1337

socket = TCPSocket.open(HOST, PORT)

puts 'CONNECTED TO: ' + HOST.to_s + ':' + PORT.to_s
socket.write 'Hello from the Ruby bot!'

puts 'RECEIVED DATA: ' + socket.gets

socket.close
puts 'Connection closed'
