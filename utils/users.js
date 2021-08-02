let users = []

// Join user to chat
function userJoin (id, username, room) {
  const user = { id: id, username: username, room: room }
  users.push(user)
  return user
}

// Get current user
function getCurrentUser (id) {
  return users.find(user => user.id === id)
}

// User leaves chat
function userLeave (id) {
  const index = users.findIndex(user => user.id === id)
  if (index !== -1) {
    return users.splice(index, 1)[0]
  }
}

// Get room users
function getRoomUsers (room) {
  const u = users.filter(user => user.room === room)
  return u
}

function usersLength (room) {
  return getRoomUsers(room).length
}

function getNextUser (id) {
  return users[(users.findIndex(user => user.id === id) + 1) % users.length]
}

function deleteRoomUsers (room) {
  // console.log('before deleting users', JSON.stringify(users))
  users = users.filter(user => user.room !== room)
  // console.log('after deleting users', JSON.stringify(users))
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  usersLength,
  getNextUser,
  deleteRoomUsers
}
