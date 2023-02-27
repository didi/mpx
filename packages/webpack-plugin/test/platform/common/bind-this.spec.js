const bindThis = require('../../../lib/template-compiler/bind-this').transform
const { trim } = require('../../../lib/utils/string')

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
    expect(trim(res)).toBe(trim(output))
  })

  it('should condition judgment is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          name1;
          if (name1) {}
          if (name2) {}
          name2;
          
          name3;
          if (name3 ? 'big' : 'small') {}
          if (name2 ? name3 : 'small') {}
          
          name4;
          if ([name4].length) {}
          
          name5;
          name5 ? 'a' : 'b';
          a;
          b;
          name5 ? a : b
        }
      };
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          if (this._c("name1", this.name1)) {}

          if (this._c("name2", this.name2)) {}
        
          if (this._c("name3", this.name3) ? 'big' : 'small') {}
        
          if (this._c("name2", this.name2) ? this._c("name3", this.name3) : 'small') {}
        
          if ([this._c("name4", this.name4)].length) {}
        
          this._c("name5", this.name5) ? 'a' : 'b';
        
          this._c("a", this.a);
        
          this._c("b", this.b);
        
          this._c("name5", this.name5) ? "" : "";
        }
      };
    `
    expect(trim(res)).toBe(trim(output))
  })

  it('should expression is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          name;
          !name;
          !!name;
          !!!!!!!name;
          
          name2;
          name3;
          name3[name2];
          
          name44 && name4.length;
          name4['length']
          !name4.length;
          
          name5;
          this._p(name5);
          
          name6;
          name7;
          name6 + name7;
          
          name8;
          name9;
          ({ key: name8 && !name9 });
          
          // 跨block
          this._p(name10);
          if (xxx) {
            this._p(name10);
            if (name10){} // 保留，不会删除外层 name10
          }
          if (name10){} // 保留

          name11;
          Number(name11);
          
          this._p(name11);

          this._p(name12.length);
          this._p(name12);
          this._i(name12, function(item){})
        }
      }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          this._c("name", this.name);

          this._c("name3", this.name3)[this._c("name2", this.name2)];
          this._c("name44", this.name44) && this._c("name4", this.name4).length;
      
          this._c("name5", this.name5);
      
          this._c("name6", this.name6);
      
          this._c("name7", this.name7);
      
          "" + "";
      
          this._c("name8", this.name8);
      
          this._c("name9", this.name9);
      
          ({
            key: "" && ""
          }); // 跨block
      
          if (this._c("xxx", this.xxx)) {
            if (this._c("name10", this.name10)) {} // 保留，不会删除外层 name10
      
          }
      
          if (this._c("name10", this.name10)) {} // 保留
      
      
          this._c("name11",this.name11);
      
          this._i(this._c("name12", this.name12), function (item) {});
        }
      };
    `
    expect(trim(res)).toBe(trim(output))
  })

  it('should backtrack variable deletion is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        a
        {
          c
          {
            b
           }
          b
        }
        b
      }
    }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        this._c("a", this.a);

        {
          this._c("c", this.c);
      
          {}
        }
      
        this._c("b", this.b);

      }
    };`
    expect(trim(res)).toBe(trim(output))
  })

  it('should variable literal is correct', function () {
    // 字面量删除 & 回溯删除前一个
    const input = `
    global.currentInject = {
      render: function () {
        a.b;
        if (a['b']) {}
        c;
        a[c];
        c.d;
        a.b[c.d];
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        if (this._c("a.b", this.a['b'])) {}

        this._c("a", this.a)[this._c("c", this.c)];
        this._c("a.b", this.a.b)[this._c("c.d", this.c.d)];
      }
    };`
    expect(trim(res)).toBe(trim(output))
  })

  it('should object is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {

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
        Object.keys({ name: bName }).length ? bName1 : bName2
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        this._c("handlerName", this.handlerName);
  
        ({
          tap: [["handler", true, 123]],
          click: [["handler"]]
        });
    
        this._c("aName", this.aName);
    
        ({
          open: true,
          str: 'str',
          name: ""
        });
  
        ({
          name: ""
        });
    
        if (this._c("bName", this.bName)) {}
    
        if (Object.keys({
          name: this._c("bName", this.bName)
        }).length) {}
        
        Object.keys({
          name: this._c("bName", this.bName)
        }).length ? this._c("bName1", this.bName1) : this._c("bName2", this.bName2);
      }
    };`
    expect(trim(res)).toBe(trim(output))
  })

  it('should operation is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        if((a || b)){
          this._p((a || b));
        }
        
        if (c) {}
        ({ active: !c })
      }
    };`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        if (this._c("a", this.a) || this._c("b", this.b)) {
          "" || "";
        }
    
        if (this._c("c", this.c)) {}
    
        ({
          active: ""
        });
      }
    };`
    expect(trim(res)).toBe(trim(output))
  })

  it('should Keep the options in the ternary operation', function () {
    const input = `
    global.currentInject = {
      render: function () {
        if (a ? b : c) {}
        a;
        b;
        c;
      }
    };`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        if (this._c("a", this.a) ? this._c("b", this.b) : this._c("c", this.c)) {}

        this._c("b", this.b);
      
        this._c("c", this.c);
      }
    };`
    expect(trim(res)).toBe(trim(output))
  })
})
