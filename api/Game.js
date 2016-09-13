let Game = require('../models/Game')
const p2 = require('p2')

const setupWorld = (game) => {
  let world = new p2.World({
    gravity:[0,0]
  })
  let wall1 = new p2.Body({
    mass: 0, 
    position: [0, 0]
  })
  let wall2 = new p2.Body({
    mass: 0, // Setting mass to 0 makes it static
    position: [game.width, game.height]
  })
  wall1.addShape(new p2.Box())
  wall2.addShape(new p2.Box())
  
  let paddle1 = new p2.Body({
    type: p2.Body.KINEMATIC,
    mass: 2,
    position: [10, (game.height / 2)]
  })
  let paddle2 = new p2.Body({
    type: p2.Body.KINEMATIC,
    mass: 2,
    position: [(game.width - 10), (game.height / 2)]
  })
  let ball = new p2.Body({
    mass: 2,
    position: [(game.width / 2), (game.height / 2)]
  })
  paddle1.addShape(new p2.Box({width: 10, height: 50}))
  paddle2.addShape(new p2.Box({width: 10, height: 50}))
  ball.addShape(new p2.Box({width: 5, height: 5}))
  
  world.addBody(paddle1)
  world.addBody(paddle2) 
  world.addBody(ball)
  console.log('we made it!')
  return {
    world: world, 
    paddle1: paddle1, 
    paddle2: paddle2,
    ball: ball}
}
const checkMotion = (paddle, game) => {
  if (paddle.up) {
    paddle.up = false
    paddle.position = [10, paddle.position[1] + 1]
  } else if (paddle.down) {
    paddle.down = false
    paddle.position = [10, paddle.position[1] - 1]
  } else {
    paddle.position = [10, paddle.position[1]]
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
      }
    })
    let timeStep = 1 / 60
    player1.on('up', (data) => {
      // console.log('(p1) got data:', data)
      paddle1.up = true 
    })
    player1.on('down', (data) => {
      // console.log('(p1) got data:', data)
      paddle1.down = true
    })
    player2.on('up', (data) => {
      // console.log('(p2) got data:', data)
      paddle2.up = true
    })
    player2.on('down', (data) => {
      // console.log('(p2) got data:', data)
      paddle1.down = true
    })
    setInterval(() => {
      round.world.step(timeStep);
      checkMotion(round.paddle1, game)
      checkMotion(round.paddle2, game)
      io.in(game._id).emit('game_update', {
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
      console.log("paddle1 x position: " + round.paddle1.position[0])
      console.log("paddle1 y position: " + round.paddle1.position[1])
    }, 1000 * timeStep)
  }, 3000)
  
}