const sizeRange = document.getElementById('pensize')
const colorRange = document.getElementById('pencolor')
const reset = document.getElementById('resetButton')
const startGameButton = document.getElementById('startGameButton')
const roomIdHeader = document.getElementById('roomid')
const currentDrawerHeader = document.getElementById('currentDrawer')
const privatePublicCheck = document.getElementById('privatePublicCheck')
const timerVal = document.getElementById('timerVal')
const wordPrompt = document.getElementById('wordPrompt')
const inputMessage = document.getElementById('message')
const sendMessageBtn = document.getElementById('sendBtn')
const chatOutput = document.getElementById('chatOutput')

let canvas = document.getElementById('canvas')
let context = canvas.getContext('2d')
let output = document.getElementById('output')
let socket = io('http://localhost:7000')

let pensize = sizeRange.value
let pencolor = colorRange.value
let is_drawing = false
let is_pressed = false
let lastX, lastY
let otherlastX, otherlastY
let playersTurn = false

let currentPlayer

const { user, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})

// # EVENT LISTENERS
document.addEventListener('DOMContentLoaded', e => {
  canvas.width = 800
  canvas.height = 650
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
})

sizeRange.addEventListener('change', e => {
  pensize = e.target.value
})

colorRange.addEventListener('change', e => {
  pencolor = e.target.value
})

canvas.addEventListener('mousedown', e => {
  is_pressed = true
})

canvas.addEventListener('pointerdown', e => {
  is_pressed = true
})

canvas.addEventListener('mousemove', e => {
  if (is_pressed) {
    let pos = getMousePos(canvas, e)
    playersTurn = true
    // console.log(pos)
    is_drawing = true
    const data = {
      pos: pos,
      strokeWidth: pensize,
      color: pencolor
    }
    // console.log(pensize, pencolor)
    socket.emit('playerDraggedMouse', data)
    draw(pos)
  }
})

canvas.addEventListener('pointermove', e => {
  if (is_pressed) {
    let pos = getMousePos(canvas, e)
    playersTurn = true
    is_drawing = true
    const data = {
      pos: pos,
      strokeWidth: pensize,
      color: pencolor
    }
    socket.emit('playerDraggedMouse', data)
    draw(pos)
  }
})

canvas.addEventListener('mouseup', e => {
  lastX = 0
  lastY = 0
  is_pressed = false
  is_drawing = false
  socket.emit('playerStoppedMouse')
  otherlastX = 0
  otherlastY = 0
})

canvas.addEventListener('pointerup', e => {
  lastX = 0
  lastY = 0
  is_pressed = false
  is_drawing = false
  socket.emit('playerStoppedMouse')
  otherlastY = 0
  otherlastX = 0
})

reset.addEventListener('click', e => {
  resetCanvas()
  socket.emit('resetCanvas')
})

canvas.addEventListener('mouseout', e => {
  is_pressed = false
  is_drawing = false
})

sendMessageBtn.addEventListener('click', e => {
  if (
    inputMessage.value !== undefined ||
    inputMessage.value !== '' ||
    inputMessage.value !== null
  ) {
    socket.emit('chat', {
      userid: socket.id,
      chatMessage: inputMessage.value
    })
    inputMessage.value = ''
  }
})

if (privatePublicCheck !== null) {
  privatePublicCheck.addEventListener('change', e => {
    if (e.target.checked) {
      socket.emit('private room')
    } else {
      socket.emit('public room')
    }
  })
}

if (startGameButton !== null) {
  startGameButton.addEventListener('click', e => {
    // document.querySelector('.wordPromptWrapper').style.display = 'flex'
    resetCanvas()
    if (!privatePublicCheck.checked) {
      socket.emit('private room')
    }
    if (document.getElementById('privatePublicWrapper') !== null) {
      document.getElementById('privatePublicWrapper').style.display = 'none'
    }
    socket.emit('create room score chart', room)
    startGameButton.style.display = 'none'
    socket.emit('gameOnForUser', socket.id)
  })
}

// FUNCTIONS AND CONTROL FLOWS
if (window.performance.getEntriesByType('navigation')[0].type == 'reload') {
  history.back()
}

function draw (pos) {
  if (is_drawing) {
    if (lastX && lastY && (pos.x !== lastX || pos.y !== lastY)) {
      context.beginPath()
      context.moveTo(lastX, lastY)
      context.lineTo(pos.x, pos.y)
      context.fillStyle = pencolor
      context.strokeStyle = pencolor
      context.lineWidth = 2 * pensize
      context.stroke()
      context.closePath()
    }

    context.fillStyle = pencolor
    context.strokeStyle = pencolor
    context.lineCap = 'round'
    context.lineJoin = 'line'
    context.beginPath()
    context.arc(pos.x, pos.y, pensize, 0, Math.PI * 2, true)
    context.closePath()
    context.fill()
    lastX = pos.x
    lastY = pos.y
  }
}

function newdraw (data) {
  if (is_drawing) {
    if (
      otherlastX &&
      otherlastY &&
      (data.pos.x !== otherlastX || data.pos.y !== otherlastY)
    ) {
      context.beginPath()
      context.moveTo(otherlastX, otherlastY)
      context.lineTo(data.pos.x, data.pos.y)
      context.fillStyle = data.color
      context.strokeStyle = data.color
      context.lineWidth = 2 * data.strokeWidth
      context.stroke()
      context.closePath()
    }

    context.fillStyle = data.color
    context.strokeStyle = data.color
    context.lineCap = 'round'
    context.lineJoin = 'line'
    context.beginPath()
    context.arc(data.pos.x, data.pos.y, data.strokeWidth, 0, Math.PI * 2, true)
    context.closePath()
    context.fill()
    otherlastX = data.pos.x
    otherlastY = data.pos.y
  }
}

function resetCanvas () {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
}

function getMousePos (canvas, evt) {
  var rect = canvas.getBoundingClientRect()
  return {
    x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
    y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
  }
}

function outputUsers (users) {
  output.innerHTML = ''
  for (const user of users) {
    const p = document.createElement('p')
    p.id = user.id
    p.innerHTML = `<strong>${user.username}</strong>`
    const scoreEle = document.createElement('strong')
    scoreEle.id = `score-${user.id}`
    p.style.fontSize = '1em'
    p.appendChild(scoreEle)
    output.appendChild(p)
  }
}

function outputRoom (room) {
  roomIdHeader.innerText = room
}

// SOCKET EMISSION AND COLLECTION
socket.emit('join room', { username: user, room: room })

socket.on('roomUsers', ({ room, users }) => {
  outputRoom(room)
  outputUsers(users)
})

socket.on('user reloaded', msg => {
  history.back()
})

socket.on('playerDraggedMouse', data => {
  is_drawing = true
  is_pressed = true
  newdraw(data)
})

socket.on('playerStoppedMouse', data => {
  is_drawing = data
  is_pressed = data
  otherlastX = 0
  otherlastY = 0
})

socket.on('resetCanvas', data => {
  if (data) {
    resetCanvas()
  }
})

socket.on('gameOnForUser', data => {
  if (socket.id !== data.playerId) {
    canvas.style.cursor = 'not-allowed'
    canvas.style.pointerEvents = 'none'
  }
  if (socket.id === data.playerId) {
    wordPrompt.innerText = data.prompt
  }
  resetCanvas()
  currentPlayer = data.playerId
  if (inputMessage.classList.contains('disabled')) {
    inputMessage.classList.remove('disabled')
  }
  currentDrawerHeader.innerText = data.playerName
})

socket.on('timer', data => {
  timerVal.innerText = data
})

socket.on('timerEnd', data => {
  if (socket.id === data.id) {
    canvas.style.cursor = 'auto'
    canvas.style.pointerEvents = 'auto'
    socket.emit('gameOnForUser', socket.id)
  }

  wordPrompt.innerText = ''
  resetCanvas()
  currentPlayer = data.id
  currentDrawerHeader.innerText = data.username
})

socket.on('game over', async data => {
  const a = document.createElement('a')
  a.href = `/result?winner=${data.username}&score=${data.score}`
  a.id = 'resultBtn'
  document.querySelector('.row').appendChild(a)
  a.click()
  document.querySelector('.row').removeChild(a)
})

socket.on('chat', data => {
  chatOutput.innerHTML =
    `<p><strong>${data.userHandle}</strong> ${data.chatMessage}</p>` +
    chatOutput.innerHTML

  console.log(data)

  if (data.id === socket.id) {
    console.log(data.chatMessage)
    if (data.chatMessage.includes('*')) {
      inputMessage.classList.add('disabled')
    }
  }
})

socket.on('initiate scores', data => {
  const userScores = data
  userScores.forEach(userScore => {
    let scoreElement = document.getElementById(`score-${userScore.userid}`)
    scoreElement.style.fontSize = '2em'
    scoreElement.innerHTML = `${userScore.score}`
  })
})
