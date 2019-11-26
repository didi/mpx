const callbacks: ((...args: any[]) => any)[] = []

window.addEventListener('resize', () => {
  const size = {
    windowWidth: window.screen.width,
    windowHeight: window.screen.height
  }
  callbacks.forEach(callback => {
    callback({
      size
    })
  })
})

function onWindowResize (callback: (...args: any[]) => any) {
  callbacks.push(callback)
}

function offWindowResize (callback: (...args: any[]) => any) {
  callbacks.splice(callbacks.indexOf(callback), 1)
}

export {
  onWindowResize,
  offWindowResize
}
