require 'json'
STDOUT.sync = true

def get_moves(state, player)
  moves = Array.new

  if player == 'r'
    energy = state["p1"]["energy"]
    spawn = state["p1"]["spawn"]
    enemy_energy = state["p2"]["energy"]
    enemy_spawn = state["p2"]["spawn"]
    player_indices = get_all_indices(state["grid"], 'r')
    enemy_indices = get_all_indices(state["grid"], 'b')
  else
    energy = state["p2"]["energy"]
    spawn = state["p2"]["spawn"]
    enemy_energy = state["p1"]["energy"]
    enemy_spawn = state["p1"]["spawn"]
    player_indices = get_all_indices(state["grid"], 'b')
    enemy_indices = get_all_indices(state["grid"], 'r')
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

while data=gets do
  game = JSON.parse data
  moves = get_moves(game['state'], game['player'])
  print JSON.generate moves
end
