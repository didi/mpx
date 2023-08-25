// todo 此处进行跨端preflights定义，保障跨端样式表现一致，待补充完善
module.exports = {
  ali: {
    preflights: [
      {
        getCSS: () => `
          button {
            height: 'initial'
          }
        `
      }
    ]
  }
}

