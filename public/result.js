window.history.pushState({ page: 1 }, '', '')

window.onpopstate = function (event) {
  if (event) {
    window.location.href = '/'
  }
}
