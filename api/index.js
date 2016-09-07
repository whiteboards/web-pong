module.exports = (client, io) => {
  let connectedClient = io.sockets.connected[client.id]
  client
    .on('setUsername', (data) => {
      console.log('setUsername data:', data)
    })
    .on('challenge', (data) => {
      console.log('challenge data:', data)
    })
    .on('acceptChallenge', (data) => {
      console.log('acceptChallenge data:', data)
    })
    .on('create', (data) => {
      console.log('make a new game!')
    })
    .on('join', (data) => {
      console.log('join', connectedClient)
    })
    .on('up', (data) => {
      console.log('got data:', data)
    })
    .on('down', (data) => {
      console.log('got data:', data)
    })
  return client
}