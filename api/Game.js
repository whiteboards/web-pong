let Game = require('../models/Game')
let Lobby = require('../models/Lobby')
const p2 = require('p2')

const score = (io, round, game) => {
  console.log('score:', {
    player1: game.player1.score,
    player2: game.player2.score
  })
  round.ball.velocity = [225, -75]
  io.in(game._id).emit('game_update', {
    score: {
      player1: game.player1.score,
      player2: game.player2.score
    },
    paddle1: {
      x: round.paddle1.position[0],
      y: round.paddle1.position[1]
    },
    paddle2: {
      x: round.paddle2.position[0],
      y: round.paddle2.position[1]
    },
    ball: {
      x: round.ball.position[0],
      y: round.ball.position[1]
    }
  })
}

const endGame = (player, game, io, gameInterval) => {
  clearInterval(gameInterval)
  console.log('winner:', player.user)
  // io.in(game._id).emit('game_end', {
  //   winner: player.user.username
  // })
}

const checkScore = (game, io, gameInterval) => {
  if (game.player1.score > 10) {
    endGame(game.player1, game, io)
  } else if (game.player2.score > 10) {
    endGame(game.player2, game, io)
  }
}

const setupWorld = (game) => {
  let world = new p2.World({
    gravity:[0,0]
  })
  let wall1 = new p2.Body({
    type: p2.Body.KINEMATIC,
    mass: 1000,
    damping: 0,
    collisionResponse: true,
    position: [0, -10]
  })
  let wall2 = new p2.Body({
    type: p2.Body.KINEMATIC,
    mass: 1000, // Setting mass to 0 makes it static
    damping: 0,
    collisionResponse: true,
    position: [0, game.height]
  })
  
  let paddle1 = new p2.Body({
    type: p2.Body.KINEMATIC,
    mass: 1000,
    damping: 0,
    collisionResponse: true,
    position: [20, (game.height / 2)]
  })
  let paddle2 = new p2.Body({
    type: p2.Body.KINEMATIC,
    mass: 1000,
    damping: 0,
    collisionResponse: true,
    position: [(game.width - 20), (game.height / 2)]
  })
  let ball = new p2.Body({
    mass: .1,
    damping: 0,
    // force: [250, 0],,
    position: [(game.width / 2), (game.height / 2)]
  })
  let ballShape = new p2.Box({width: 5, height: 5})
  let ballMaterial = new p2.Material()
  let defaultMaterial = new p2.Material()
  ballShape.material = ballMaterial
  
  paddle1.addShape(new p2.Box({width: 10, height: 50, material: defaultMaterial}))
  paddle2.addShape(new p2.Box({width: 10, height: 50, material: defaultMaterial}))
  ball.addShape(ballShape)
  wall1.addShape(new p2.Box({width: game.width, height: 10, material: defaultMaterial}))
  wall2.addShape(new p2.Box({width: game.width, height: 10, material: defaultMaterial}))
  let ballAndDefault = new p2.ContactMaterial(ballMaterial, defaultMaterial, {
    // friction : 0.0,
    restitution: 1
  })

  world.addBody(paddle1)
  world.addBody(paddle2)
  world.addBody(wall1)
  world.addBody(wall2)
  world.addBody(ball)
  world.addContactMaterial(ballAndDefault)
  return {
    world: world, 
    paddle1: paddle1, 
    paddle2: paddle2,
    ball: ball,
    wall1: wall1,
    wall2: wall2
  }
}
const checkMotion = (paddle, game) => {
  if (paddle.up) {
    paddle.up = false
    paddle.position = [paddle.position[0], paddle.position[1] - 2]
    // paddle.velocity = [0, paddle.velocity[1] - 2]
    console.log(paddle.position)
  } else if (paddle.down) {
    paddle.down = false
    paddle.position = [paddle.position[0], paddle.position[1] + 2]
    // paddle.velocity = [0, paddle.velocity[1] + 2]
    console.log(paddle.position)
  } else {
    paddle.position = [paddle.position[0], paddle.position[1]]
    // paddle.velocity = [0, 0]
  }
}

module.exports = (player1, player2, io) => {
  console.log('spinning up game...')
  let game = new Game({
    player1: player1.user,
    player2: player2.user
  })
  console.log('game:', game._id, game.width, game.height)
  player1.leave('lobby')
  player2.leave('lobby')
  player1.join(game._id)
  player2.join(game._id)
  io.in(game._id).emit('game_join', game)
  let round = setupWorld(game)
  console.log('game_start:')
  setTimeout(() => {
    io.in(game._id).emit('game_start', {
      paddle1: {
        x: round.paddle1.position[0],
        y: round.paddle1.position[1]
      },
      paddle2: {
        x: round.paddle2.position[0],
        y: round.paddle2.position[1]
      },
      ball: {
        x: round.ball.position[0],
        y: round.ball.position[1]
      },
      wall1: {
        body: {
          w: round.wall1.shapes[0].width,
          h: round.wall1.shapes[0].height,
        },
        x: round.wall1.position[0],
        y: round.wall1.position[1],
      },
      wall2: {
        body: {
          w: round.wall2.shapes[0].width,
          h: round.wall2.shapes[0].height,
        },
        x: round.wall2.position[0],
        y: round.wall2.position[1],
      }
    })
    // let timeStep = 1 / 60
    player1.on('up', (data) => {
      // console.log('(p1) got data:', data)
      round.paddle1.up = true 
    })
    player1.on('down', (data) => {
      // console.log('(p1) got data:', data)
      round.paddle1.down = true
    })
    .on('disconnect', () => {
      console.log('disconnected', client.user)
      clearInterval(gameInterval)
      io.in(game._id).emit('game_end', {
        winner: player2.user.username
      })
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
    player2.on('up', (data) => {
      // console.log('(p2) got data:', data)
      round.paddle2.up = true
    })
    player2.on('down', (data) => {
      // console.log('(p2) got data:', data)
      round.paddle2.down = true
    })
    
    let maxSubSteps = 10
    let fixedTimeStep = 1 / 60
    let lastTimeSeconds
    round.world.on('beginContact', (evt) => {
      console.log('evt:', evt.bodyA.position)
    })
    game.player1.score = 0
    game.player2.score = 0
    round.ball.velocity = [225, -75]
    let gameInterval = setInterval(() => {
      // var timeSeconds = t / 1000
      // lastTimeSeconds = lastTimeSeconds || timeSeconds
      // var timeSinceLastCall = timeSeconds - lastTimeSeconds
      // round.world.step(fixedTimeStep, timeSinceLastCall, maxSubSteps)
      round.world.step(fixedTimeStep)
      if (round.ball.position[1] > game.height-1 || round.ball.position[1] < 1) {
        round.ball.velocity[1] *= -1
        round.ball.velocity[1] = (round.ball.velocity[1] + (round.ball.velocity[1] * .25)) 
      }
      if (round.ball.position[0] < 1) {
        game.player2.score += 1
        round = setupWorld(game)
        score(io, round, game)
      }
      if (round.ball.position[0] > game.width-1) {
        game.player1.score += 1
        round = setupWorld(game)
        score(io, round, game)
      }
      checkMotion(round.paddle1, game)
      checkMotion(round.paddle2, game)
      checkScore(game, io, gameInterval)
      io.in(game._id).volatile.emit('game_update', {
        score: {
          player1: game.player1.score,
          player2: game.player2.score
        },
        paddle1: {
          x: round.paddle1.position[0],
          y: round.paddle1.position[1]
        },
        paddle2: {
          x: round.paddle2.position[0],
          y: round.paddle2.position[1]
        },
        ball: {
          x: round.ball.position[0],
          y: round.ball.position[1]
        }
      })
      // console.log("paddle1 x position: " + round.paddle1.position[0])
      // console.log("paddle1 y position: " + round.paddle1.position[1])
    }, 1000 * fixedTimeStep)
    player1.on('disconnect', () => {
      console.log('disconnected', client.user)
      clearInterval(gameInterval)
      io.in(game._id).emit('game_end', {
        winner: player2.user.username
      })
      if (!player1.user) {
        console.log('no user to remove')
      } else {
        Lobby.findOneAndUpdate( {'users.socket_id' : player1.user.id},
          {
            $pull: { users: { socket_id: player1.user.id }}
          },
          {new: true},
          (err, lobby) => {
           console.log(err,lobby)
           io.in('lobby').emit('lobby_info', lobby)
        })
      }
    })
    player2.on('disconnect', () => {
      console.log('disconnected', player2.user)
      clearInterval(gameInterval)
      io.in(game._id).emit('game_end', {
        winner: player2.user.username
      })
      if (!player2.user) {
        console.log('no user to remove')
      } else {
        Lobby.findOneAndUpdate( {'users.socket_id' : player2.user.id},
          {
            $pull: { users: { socket_id: player2.user.id }}
          },
          {new: true},
          (err, lobby) => {
           console.log(err,lobby)
           io.in('lobby').emit('lobby_info', lobby)
        })
      }
    })
  }, 3000)
  
}