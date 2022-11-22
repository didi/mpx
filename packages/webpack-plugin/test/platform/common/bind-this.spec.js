const bindThis = require('../../../lib/template-compiler/bind-this').transform

describe('render function simplify should correct', function () {

  it('should Normal Scope Deletion is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        (grade)
        if (random) {
          (name);
        } else {
          (grade)
          name
        }
        
        aName;
        if (random) {
          aName
        }
        
        bName;
        bName;
        if (random) {
          bName
        } else {
          bName
        }
      }
    }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        this._c("grade", this.grade);

        if (this._c("random", this.random)) {
          this._c("name", this.name);
        } else {
          this._c("name", this.name);
        }
    
        this._c("aName", this.aName);
    
        if (this._c("random", this.random)) {}
    
        this._c("bName", this.bName);
    
        if (this._c("random", this.random)) {} else {}
    
        this._c("cName", this.cName);
    
        if (this._c("random", this.random)) {
          if (this._c("random2", this.random2)) {} else {}
        }
      }
    };`
    expect(res).toMatchSnapshot(output)
  })

  // 回溯
  it('should backtrack variable deletion is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        aName;
        if (aName) {};

        if ( random) {
          bName
        } else {
          bName
        }
        bName
      }
    }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        this._c("aName", this.aName);

        if (this._c("aName", this.aName)) {}
    
        if (this._c("random", this.random)) {
          this._c("bName", this.bName);
        } else {
          this._c("bName", this.bName);
        }
    
        this._c("bName", this.bName);
      }
    };`
    expect(res).toMatchSnapshot(output)
  })

  it('should variable literal is correct', function () {
    // 字面量删除 & 回溯删除前一个
    const input = `
    function render() {
      a.b;
      if (a['b']) {}
      c;
      a[c];
      c.d;
      a.b[c.d];
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    function render() {
      if (this._c("a.b", this.a['b'])) {}

      this._c("a", this.a)[this._c("c", this.c)];
      this._c("a.b", this.a.b)[this._c("c.d", this.c.d)];
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
      
    }`
    expect(res).toMatchSnapshot(output)
  })
})
