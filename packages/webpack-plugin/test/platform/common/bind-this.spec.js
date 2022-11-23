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
        
        cName;
        if (random) {
          cName;
          dName;
          if (random2) {
            cName;
            dName;
          }
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
            this._c("dName", this.dName);
      
            if (this._c("random2", this.random2)) {}
          }
        }
      };
    `
    expect(res).toMatchSnapshot(output)
  })

  it('should If condition judgment is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          name1;
          if (name1) {}
          if (name2) {}
          name2;
          
          name3;
          if (name3 ? 'big' : 'small') {}
          
          name4;
          if ([name4].length) {}
        }
      }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          if (this._c("name1", this.name1)) {}
  
          if (this._c("name2", this.name2)) {}
  
          if (this._c("name3", this.name3) ? 'big' : 'small') {}
          
          if ([this._c("name4", this.name4)].length) {}
        }
      }
    `
    expect(res).toMatchSnapshot(output)
  })

  // 回溯 目前没处理
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

  it('should _p is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          if (aName) {
            this._p(aName)
          }
          
          this._p(bName)
          if (bName) {}
        }
      }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          if (this._c("name", this.name)) {}

          if (this._c("aName", this.aName)) {}
        }
      }
    `
    expect(res).toMatchSnapshot(output)
  })

  it('should object is correct', function () {
    const input = `
    function render() {

      handlerName;
      ({tap:[["handler",true, 123]],click:[["handler",handlerName]]});

      aName;
      ({
        open: true,
        str: 'str',
        name: aName
      });

      ({
        name: bName
      });
      if (bName) {}
      if (Object.keys({ name: bName }).length) {}
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    function render() {
      this._c("handlerName", this.handlerName);

      ({
        tap: [["handler", true, 123]],
        click: [["handler"]]
      });
  
      this._c("aName", this.aName);
  
      ({
        open: true,
        str: 'str'
      });

      ({});
  
      if (this._c("bName", this.bName)) {}
  
      if (Object.keys({
        name: this._c("bName", this.bName)
      }).length) {}
    }`
    expect(res).toMatchSnapshot(output)
  })
})
