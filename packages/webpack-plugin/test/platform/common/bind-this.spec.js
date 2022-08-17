const bindThis = require('../../../lib/template-compiler/bind-this').transform

describe('reduce render function literal', function () {

  function wrapContent(code) {
    return `
global.currentInject = {
  moduleId: 1,
  render: function () {
    ${code}
    this._r();
  }
};
    `
  }

  it('should boolean literal or number literal is deleted', function () {
    const input = wrapContent(`
    (true);
    (123);
    `)
    const output = bindThis(input).code
    expect(output).toBe('')
  })

  it('should ', function () {
    const input = `
      'aaa' + (name)
    `
    const output = bindThis(input).code
    expect(output).toBe('')
  });
})
