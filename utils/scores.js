let scores = []

function addRoomScoreChart (room, users) {
  let scoreChart = {}
  scoreChart['room'] = room
  users.forEach(user => {
    if (scoreChart['users'] === undefined) {
      scoreChart['users'] = []
    }
    scoreChart['users'].push({
      userid: user.id,
      score: 0
    })
  })
  scores.push(scoreChart)
}

function getRoomScores (room) {
  const usersScores = scores.find(score => score.room === room)
  return usersScores
}

function getUsersScore (room, id) {
  const roomIndex = scores.findIndex(score => score.room === room)
  const userIndex = scores[roomIndex].users.findIndex(
    user => user.userid === id
  )
  return scores[roomIndex].users[userIndex].score
}

function changeUserScore (room, id) {
  const roomIndex = scores.findIndex(score => score.room === room)
  const userIndex = scores[roomIndex].users.findIndex(
    user => user.userid === id
  )
  scores[roomIndex].users[userIndex].score += 100
}

function getMaxScoreOfRoom (room) {
  const roomIndex = scores.findIndex(score => score.room === room)
  const specificRoomScores = scores[roomIndex].users.map(user => user.score)
  const max = Math.max(...specificRoomScores)
  const maxScorer = scores[roomIndex].users.find(user => user.score === max)
  return maxScorer
}

function deleteRoomScores (room) {
  // console.log('before deleting scores', JSON.stringify(scores))
  const index = scores.findIndex(score => score.room === room)
  if (index > -1) {
    scores.splice(index, 1)
  }
  // console.log('after deleting scores', JSON.stringify(scores))
}

module.exports = {
  addRoomScoreChart,
  getRoomScores,
  changeUserScore,
  getMaxScoreOfRoom,
  getUsersScore,
  deleteRoomScores
}
