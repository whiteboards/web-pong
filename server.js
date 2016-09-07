const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const api = require('./api')

app.set('dbhost', process.env.dbHost || '127.0.0.1')
app.set('dbname', process.env.dbName || 'web-pong')

if (process.env.dbUser) {
  mongoose.connect('mongodb://'+process.env.dbUser+':'+process.env.dbPass+'@' + app.get('dbhost') + '/' + app.get('dbname'))
} else {
  mongoose.connect('mongodb://' + app.get('dbhost') + '/' + app.get('dbname'))
}

app.set('port', process.env.PORT || 8081)
app.set('ip', process.env.IP || '0.0.0.0')

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
  next()
})
io.use(function (socket, next) {
  let token = socket.request._query.token
  let tokenSecret = process.env.tokenSecret || 'a really awful secret'
  if (token) {
    try {
    let decoded = jwt.verify(handshakeData, tokenSecret)
    console.log('got data:', decoded)
    socket.authenticated = true
    socket.user = decoded 
    } catch (err) {
      console.log('err:', err)
    }
  }
  next()
})

io.on('connection', function (socket) {
    console.log('got socket connection')
    api(socket, io)
  })
server.listen(app.get('port'), app.get('ip'), function () {
  console.log('web-pong has started on port:', app.get('port'))
})