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
                console.log(lobby.users);
              }
            })
          }
        })
      }
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
        console.log('player1 is still active:', player1.user.username)
        console.log('existing challenges for player1:', player1.challenges[client.id])
          if (player1.challenges[client.id] === 0) {
            console.log('challenge exists, accepting..')
            delete player1.challenges[client.id]
            Game(player1, connectedClient, io)
          }
      }
    })
    .on('decline_challenge', (data) => {
      console.log('declineChallenge data:', data)
      let player1 = io.sockets.connected[data.socket_id]
      if (player1) {
        console.log('player1 is still active:', player1.user.username)
        console.log('existing challenges for player1:', player1.challenges)
          if (player1.challenges[client.id] === 0) {
            console.log('challenge exists, declining..')
            player1.challenges[client.id] = -1
          }
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
  return client
}
