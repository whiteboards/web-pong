let Lobby = require('../models/Lobby')
const Game = require('./Game')
module.exports = (client, io) => {
  let connectedClient = io.sockets.connected[client.id]
  client
    .on('set_username', (data) => {
      console.log('setUsername data:', data)
      connectedClient.user = {
        username: data.username,
        id: client.id
      }
      connectedClient.challenges = {}
      connectedClient.emit('authenticated')
    })
    .on('challenge', (data) => {
      console.log('challenge data:', data)
      connectedClient.challenges[data.socket_id] = 0
      connectedClient.broadcast.to(data.socket_id)
        .emit('challenge', connectedClient.user)
    })
    .on('accept_challenge', (data) => {
      console.log('acceptChallenge data:', data)
      let player1 = io.sockets.connected[data.socket_id]
      if (player1) {
        console.log('player1 is still active:', player1)
          if (player1.challenges[client.id]) {
            console.log('challenge exists:', player1.challenges[client.id])
          }
      }
    })
    .on('decline_challenge', (data) => {
      console.log('declineChallenge data:', data)

    })
    .on('join_lobby', (data) => {
      console.log('join', connectedClient.user)
      if (!connectedClient.user) {
        console.log('no user found')
      } else {
        client.join('lobby')
        Lobby.findOrCreate({title: 'Lobby'}, (err, lobby, created) => {
          if (err) {
            console.log('err:', err)        
          } else {
            let oldLobby = lobby
            lobby.users.push({
              socket_id: connectedClient.user.id,
              username: connectedClient.user.username
            })
            lobby.save((err) => {
              if (err) {
                console.log('err:', err)
              } else {
                io.in('lobby').emit('lobby_info', lobby)
                // connectedClient.broadcast.to('lobby').emit('lobby_info', lobby)
                // connectedClient.emit('loby_info', oldLobby)
                console.log(lobby.users);
              }
            })
          }
        })
      }
    })
    .on('disconnect', () => {
      console.log('disconnected', client.user)
      if (!client.user) {
        console.log('no user to remove')
      } else {
        Lobby.findOneAndUpdate( {'users.socket_id' : client.user.id},
          {
            $pull: { users: { socket_id: client.user.id }}
          },
          {new: true},
          (err, lobby) => {
           console.log(err,lobby)
           io.in('lobby').emit('lobby_info', lobby)
        })
      }
    })
    .on('up', (data) => {
      console.log('got data:', data)
    })
    .on('down', (data) => {
      console.log('got data:', data)
    })
  return client
}
