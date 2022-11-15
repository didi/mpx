const bindThis = require('../../../lib/template-compiler/bind-this').transform

describe('render function simplify should correct', function () {

  it('should variable literal is correct', function () {
    const input = `
    function render() {
      if (random) {
        name;
        sex
      } else {
        age;
        sex
      }
      grade
      if (random) {
        name
      } else {
        grade
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    function render() {
      
    }`
    expect(res).toMatchSnapshot(output)
  })

  it('should variable literal is correct', function () {
    const input = `
    function render() {
      a;
      a;
      a.b;
      a['b'];
      a.b[c];
      a.b['c'];
      if (a.b) {}
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    function render() {
      this._c("a", this.a);
      this._c("a.b", this.a.b);
    
      this._c("a.b", this.a.b)[this._c("c", this.c)];
    
      if (this._c("a.b", this.a.b)) {}
    }`
    expect(res).toMatchSnapshot(output)
  })

  it('should _p function is correct', function () {
    const input = `
    function render() {
      tip;
      this._p(tip)
      this._p(tip && msg || 'str')
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    function render() {
      this._c("tip", this.tip);
  
      this._c("tip", this.tip) && this._c("msg", this.msg) || 'str';
    }`
    expect(res).toMatchSnapshot(output)
  })

  it('should object is correct', function () {
    const input = `
    function render() {
      ({tap:[["handler",true, 123]],click:[["handler",handlerName]]});
      [1, inArr, 'bb', true];
      if([1, inArr, 'bb', true].length){};
    
      grade;
      ({
        name: 'zzh',
        age: 12,
        sex: true,
        grade: grade
      });
      grade.name;
      ({
        grade: grade[index],
        grade1: grade.name,
        grade2: grade['name']
       })
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    function render() {
      ({
        tap: [[]],
        click: [[this._c("handlerName", this.handlerName)]]
      });
      [this._c("inArr", this.inArr)];
    
      if ([1, this._c("inArr", this.inArr), 'bb', true].length) {}
    
      this._c("grade", this.grade);
    
      ({});
      
      this._c("grade.name", this.grade.name);
    
      ({
        grade: this._c("grade", this.grade)[this._c("index", this.index)]
      });
    }`
    expect(res).toMatchSnapshot(output)
  })
})
