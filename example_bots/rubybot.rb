require 'socket'

HOST = '127.0.0.1'
PORT = 1337

socket = TCPSocket.open(HOST, PORT)

socket.write 'ready'

puts 'RECEIVED DATA: ' + socket.gets

socket.close
puts 'Connection closed'
