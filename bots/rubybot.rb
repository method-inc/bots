require 'socket'
require 'json'

def get_moves(state, player)
  moves = Array.new

  if player == 'a'
    food = state["p1"]["food"]
    spawn = state["p1"]["spawn"]
    enemy_food = state["p2"]["food"]
    enemy_spawn = state["p2"]["spawn"]
    player_indices = get_all_indices(state["grid"], 'a')
    enemy_indices = get_all_indices(state["grid"], 'b')
  else
    food = state["p2"]["food"]
    spawn = state["p2"]["spawn"]
    enemy_food = state["p1"]["food"]
    enemy_spawn = state["p1"]["spawn"]
    player_indices = get_all_indices(state["grid"], 'b')
    enemy_indices = get_all_indices(state["grid"], 'a')
  end

  player_indices.each do |i|
    adjacent = get_adjacent_indices(state, i)
    to = adjacent.sample
    moves.push({from:i, to:to})
  end

  moves
end

def index_to_coord(state, index)
  x = index%state["cols"]
  y = index/state["cols"]
  coord = {x:x, y:y}
  coord
end

def coord_to_index(state, coord)
  index = state["cols"] * coord[:y] + coord[:x]
  index
end

def get_all_indices(grid, search)
  arr = (0...grid.length).find_all { |i| grid[i,1] == search }
  arr
end

def get_adjacent_indices(state, index)
  indices = Array.new;
  coord = index_to_coord(state, index)
  if coord[:x] > 0
    indices.push(coord_to_index(state, {x:coord[:x]-1, y:coord[:y]}))
  end
  if coord[:x] < state["cols"]-1
    indices.push(coord_to_index(state, {x:coord[:x]+1, y:coord[:y]}))
  end
  if coord[:y] > 0
    indices.push(coord_to_index(state, {x:coord[:x], y:coord[:y]-1}))
  end
  if coord[:y] < state["rows"]-1
    indices.push(coord_to_index(state, {x:coord[:x], y:coord[:y]+1}))
  end

  indices
end

HOST = '127.0.0.1'
PORT = 1337

socket = TCPSocket.open(HOST, PORT)

socket.write 'ready'

while data=socket.gets do
  game = JSON.parse data
  moves = get_moves(game['state'], game['player'])
  puts JSON.generate game
  socket.write JSON.generate moves
end

socket.close
puts 'Connection closed'
