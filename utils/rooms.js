let rooms = []

// Push room into chat

function roomCreated (id) {
  const room = { roomid: id, access: 0 /* 0 -> public, 1 -> private*/ }
  rooms.push(room)
  return room
}

// Get current room
function getCurrentRoom (id) {
  return rooms.find(room => room.roomid === id)
}

// Toggle Change access type
function toggleAccess (id) {
  const index = rooms.findIndex(room => room.roomid === id)
  if (index !== -1) {
    rooms[index].access === 0
      ? (rooms[index].access = 1)
      : (rooms[index].access = 0)
  }
}

function getRooms () {
  return rooms
}

function roomAlreadyExists (id) {
  const index = rooms.findIndex(room => room.roomid === id)
  if (index !== -1) {
    return true
  }
  return false
}

function deleteRoom (room) {
  // console.log('Before deleting room', JSON.stringify(rooms))
  const index = rooms.findIndex(room => room.roomid === room)
  rooms.splice(index, 1)
  // console.log('After deleting room', JSON.stringify(rooms))
}

module.exports = {
  getCurrentRoom,
  getRooms,
  roomCreated,
  toggleAccess,
  roomAlreadyExists,
  deleteRoom
}
