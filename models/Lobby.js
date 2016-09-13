const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')
const user = mongoose.Schema({
  socket_id: String,
  username: String
})

const Lobby = mongoose.Schema({
  title: String,
  alias: String,
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  users: [user]
})

Lobby.plugin(findOrCreate)

module.exports = mongoose.model('lobby', Lobby)
