let mongoose = require('mongoose')

// let message = mongoose.Schema({
//   message: String,
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user',
//     index: true
//   },
//   date: {type: Date, default: Date.now}
// })
// let user = mongoose.Schema({
//   online: {
//     type: Boolean,
//     default: false,
//   }, 
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user',
//     index: true
//   }
// })

let Game = mongoose.Schema({
  // title: String,
  // messages: [message],
  // alias: String,
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 400
  }
  // users: [user]
})

module.exports = mongoose.model('game', Game)
