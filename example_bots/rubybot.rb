require 'socket'
require 'json'

HOST = '127.0.0.1'
PORT = 1337

socket = TCPSocket.open(HOST, PORT)

socket.write 'ready'

state = JSON.parse(socket.gets)

puts 'RECEIVED DATA: ' + state['grid'].to_s

socket.close
puts 'Connection closed'
