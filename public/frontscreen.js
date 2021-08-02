window.addEventListener('pageshow', e => {
  const eles = Array.from(document.getElementsByTagName('input'))
  eles.forEach(element => {
    if (element.type === 'text') {
      element.value = ''
    }
  })
})

