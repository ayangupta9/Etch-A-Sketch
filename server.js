const express = require('express')
const socketio = require('socket.io')
const ejs = require('ejs')
const path = require('path')

const {
  getRoomUsers,
  userJoin,
  userLeave,
  getCurrentUser,
  usersLength,
  getNextUser,
  deleteRoomUsers
} = require('./utils/users')

const {
  roomCreated,
  getCurrentRoom,
  toggleAccess,
  getRooms,
  roomAlreadyExists,
  deleteRoom
} = require('./utils/rooms')

const { getRandomWord } = require('./utils/misc')

const {
  addRoomScoreChart,
  getRoomScores,
  changeUserScore,
  getMaxScoreOfRoom,
  // getUsersScore,
  deleteRoomScores
} = require('./utils/scores')

const { nanoid } = require('nanoid')
const PORT = process.env.PORT || 7000
const timerVal = 30
const app = express()

app.use(express.static('./public'))
let server = app.listen(PORT, () => {
  console.log('Server is running')
})

let io = socketio(server)
let rounds = {}
let currentRandomWords = {}

app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/frontScreen.html'))
})

app.get('/result', (req, res) => {
  res.render('result', {
    winner: req.query.winner,
    score: req.query.score
  })
})

app.post('/createroom', (req, res) => {
  if (req.body.username.length === 0) {
    res.redirect('/')
  }
  const newRoomId = nanoid(6)
  res.redirect(`/created?user=${req.body.username}&room=${newRoomId}`)
})

app.post('/joinroom', (req, res) => {
  if (req.body.username.length === 0 && req.body.roomid.length === 0) {
    res.redirect('/')
  }
  const index = getRooms().findIndex(room => room.roomid === req.body.roomid)
  if (index !== -1) {
    if (getCurrentRoom(req.body.roomid).access === 0) {
      res.redirect(`/joined?user=${req.body.username}&room=${req.body.roomid}`)
    } else {
      res.redirect('/')
    }
  } else {
    res.redirect('/')
  }
})

app.get('/joined', (req, res) => {
  const room = getCurrentRoom(req.query.room)
  if (room.access === 0) {
    res.render('sketch', { admin: 0 })
  } else {
    res.redirect('/')
  }
})

app.get('/created', (req, res) => {
  if (roomAlreadyExists(req.query.room)) {
    res.redirect(`/joined?user=${req.query.user}&room=${req.query.room}`)
  } else {
    const room = roomCreated(req.query.room)
    res.render('sketch', { admin: 1 })
  }
})

function deleteRoomRounds (room) {
  delete rounds[room]
}

function gameOver (room) {
  const maxScorer = getMaxScoreOfRoom(room)
  const currentUser = getCurrentUser(maxScorer.userid)

  const sendData = {
    id: currentUser.id,
    username: currentUser.username,
    score: maxScorer.score
  }

  deleteRoom(room)
  deleteRoomScores(room)
  deleteRoomUsers(room)
  deleteRoomRounds(room)

  io.sockets.to(room).emit('game over', sendData)
}

function gamePlayTime (user) {
  let count = timerVal
  let interval = setInterval(() => {
    if (count === 0) {
      if (rounds[user.room] === usersLength(user.room) * 5 - 1) {
        gameOver(user.room)
      } else {
        io.sockets.emit('timerEnd', getNextUser(user.id))
        rounds[user.room] += 1
      }
      clearInterval(interval)
      return
    }
    io.sockets.to(user.room).emit('timer', count)
    count = count - 1
  }, 1000)
}

function checkRounds (room) {
  if (Object.keys(rounds).includes(room) === false) {
    rounds[room] = 0
  }
}

io.on('connection', socket => {
  socket.on('join room', data => {
    const user = userJoin(socket.id, data.username, data.room)

    socket.join(user.room)
    io.sockets.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    })

    socket.on('create room score chart', data => {
      const users = getRoomUsers(data)
      addRoomScoreChart(data, users)
    })

    socket.on('gameOnForUser', async data => {
      const currentUser = getCurrentUser(data)
      const randomPrompt = getRandomWord()

      currentRandomWords[currentUser.room] = randomPrompt
      checkRounds(currentUser.room)

      const roomScores = getRoomScores(currentUser.room).users

      io.sockets.to(currentUser.room).emit('initiate scores', roomScores)

      const userInfo = {
        playerId: data,
        playerName: currentUser.username,
        prompt: randomPrompt
      }

      gamePlayTime(user)
      io.sockets.to(user.room).emit('gameOnForUser', userInfo)
    })

    socket.on('playerDraggedMouse', data => {
      socket.broadcast.to(user.room).emit('playerDraggedMouse', data)
    })

    socket.on('playerStoppedMouse', () => {
      socket.broadcast.to(user.room).emit('playerStoppedMouse', false)
    })

    socket.on('resetCanvas', () => {
      socket.broadcast.to(user.room).emit('resetCanvas', true)
    })

    socket.on('user reloaded', () => {
      socket.broadcast
        .to(user.room)
        .emit('user reloaded', `${user.username} reloaded`)
    })

    socket.on('private room', () => {
      toggleAccess(user.room)
    })

    socket.on('public room', () => {
      toggleAccess(user.room)
    })

    socket.on('chat', data => {
      const user = getCurrentUser(data.userid)
      let chatMessage

      if (data.chatMessage === currentRandomWords[user.room]) {
        guessedWithinTime = true
        changeUserScore(user.room, user.id)
        const roomScores = getRoomScores(user.room).users
        io.sockets.to(user.room).emit('initiate scores', roomScores)
        chatMessage = '*'.repeat(data.chatMessage.length)
      } else {
        chatMessage = data.chatMessage
      }

      const sendData = {
        id: user.id,
        userHandle: user.username,
        chatMessage: chatMessage
      }

      io.sockets.to(user.room).emit('chat', sendData)
    })
  })

  socket.on('disconnect', () => {
    const user = userLeave(socket.id)
    if (user) {
      io.sockets.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
    }

    const obj = Object.fromEntries(io.sockets.adapter.rooms)
    if (Object.keys(obj).length === 0) {
      deleteRoom(user.room)
      deleteRoomScores(user.room)
      deleteRoomUsers(user.room)
      deleteRoomRounds(user.room)

      console.log('Deleted All')
    }
  })
})
