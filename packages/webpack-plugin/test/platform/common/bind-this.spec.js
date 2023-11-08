const bindThis = require('../../../lib/template-compiler/bind-this').transform
const { trimBlankRow } = require('../../../lib/utils/string')

describe('render function simplify should correct', function () {
  it('should normal delete is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          a;
          if (a) {}
  
          b;
          c;
          a ? b : c
  
          a && b;
  
          d;
          e;
          if (a ? d : e) {}
          
          obj1;
          obj1.a;
          
          obj2;
          obj2.a.b;
  
          String(a).b.c;
          !!!String(a).b.c;
        }
      }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    if (_c("a")) {}
    _c("c");
    _c("a") ? _c("b") : _c("c");
    _c("a") && _c("b");
    _c("d");
    _c("e");
    if (_c("a") ? _c("d") : _c("e")) {}
    _c("obj1");
    _c("obj2");
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('wxs check', function () {
    const input = `
    global.currentInject = {
      render: function () {
        if (bName) {} // 1
        this._p(bName)
        this._p(wxs.test(bName)) // 3
        this._p(wxs.test(bName + cName)) // 4
        Number(bName + cName) // 5
        this._p(Number(bName + cName)) // 6
        Object.keys({ name: bName }).length // 7

        this._p(Object.keys({ name: bName })) // 8

        this._p(Object.keys(bName)) // 9

        if (bName) {} // 10
        this._p(bName)
        wxs.test(bName); // 删除wxs.test
        this._p(wxs.test(bName + cName)) // 12
        this._p(wxs.test(bName + cName)) // 13
        Object.keys({ name: bName }).length // 14
        
        
        if (Object.keys({ name: bName }).length) {} // 15

        Object.keys({ name: bName }).length ? bName1 : bName2 // 16

        this._p(Object.keys({ name: bName }).length ? bName1 : bName2) // 17
      }
    }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true, ignoreMap: { wxs: true } }).code
    const output = `
global.currentInject = {
  render: function () {
    if (_c("bName")) {} // 1

    // 3
    wxs.test("" + _c("cName")); // 4
  
    Number("" + ""); // 5
  
    Number("" + ""); // 6
  
    Object.keys({
      name: ""
    }).length; // 7
  
    Object.keys({
      name: ""
    }); // 8
  
    // 9
    if (_c("bName")) {} // 10
    // 删除wxs.test
    wxs.test("" + ""); // 12
  
    wxs.test("" + ""); // 13
  
    Object.keys({
      name: ""
    }).length; // 14
    
    if (Object.keys({
      name: _c("bName")
    }).length) {} // 15
  
  
    Object.keys({
      name: _c("bName")
    }).length ? _c("bName1") : _c("bName2"); // 16
  
    Object.keys({
      name: _c("bName")
    }).length ? _c("bName1") : _c("bName2"); // 17
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

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
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    _c("grade");

    if (_c("random")) {
      _c("name");
    } else {
      _c("name");
    }

    _c("aName");

    if (_c("random")) {}

    _c("bName");

    if (_c("random")) {} else {}

    _c("cName");

    if (_c("random")) {
      _c("dName");

      if (_c("random2")) {}
    }
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
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
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    if (_c("name1")) {}

    if (_c("name2")) {}
  
    if (_c("name3") ? 'big' : 'small') {}
  
    if (_c("name2") ? _c("name3") : 'small') {}
  
    if ([_c("name4")].length) {}
  
    _c("name5") ? 'a' : 'b';
  
    _c("a");
  
    _c("b");
  
    _c("name5") ? _c("a") : _c("b");
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should prefix check is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          name;
          nameage;
          name.age
        }
      }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code

    const output = `
global.currentInject = {
  render: function () {
    _c("name");
    _c("nameage");
  }
};`

    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
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
          
          name4 && name4.length;
          name4['length']
          !name4.length;
          
          name5;
          this._p(name5);
          
          name6;
          name7;
          name6 + name7;
          name6 + '123';
          '123' + name7;
          '123' + name7 + name6;
          name6 + '123' + name7 + name6;
          
          
          name8;
          name9;
          ({ key: name8 && !name9 });
          ({ key: name9 });

          this._p(name10);
          if (xxx) {
            this._p(name10);
            if (name10){}
          }
          if (name10){}

          name11;
          Number(name11);
          
          this._p(name11);

          this._p(name12.length);
          this._p(name12);
          this._i(name12, function(item){})
        }
      }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    _c("name");

    _c("name3")[_c("name2")];
    _c("name4") && _c("name4").length;

    _c("name5");

    _c("name6");

    _c("name7");

    "" + "";
    "" + '123';
    '123' + "";
    '123' + "" + "";
    "" + '123' + "" + "";

    ({
      key: _c("name8") && !_c("name9")
    });
    ({
      key: ""
    });

    if (_c("xxx")) {
      if (_c("name10")) {}

    }

    if (_c("name10")) {}


    _c("name11");

    this._i(_c("name12"), function (item) {});
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
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
          aa // 分割线
          {
            a
            b
            c
            d
          }
          b
        }
        b
      }
    }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    _c("a");

    {
      _c("c");
  
      {}
  
      _c("aa"); // 分割线
  
  
      {
        _c("d");
      }
    }
  
    _c("b");

  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should variable literal is correct', function () {
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
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    if (_c("a.b")) {}

    _c("a")[_c("c")];
    _c("a.b")[_c("c.d")];
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
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
        this._p(bName)
        Number(bName + cName)
        this._p(Number(bName + cName))
        Object.keys({ name: bName }).length
        
        if (Object.keys({ name: bName }).length) {}
        
        Object.keys({ name: bName }).length ? bName1 : bName2
        
        this._p(Object.keys({ name: bName }).length ? bName1 : bName2)
        
        this._p(Object.keys({ name: bName }))
        
        this._p(Object.keys(bName))
      }
    }`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    _c("handlerName");

    ({
      tap: [["handler", true, 123]],
      click: [["handler", ""]]
    });
  
    _c("aName");
  
    ({
      open: true,
      str: 'str',
      name: ""
    });
    ({
      name: ""
    });
  
    if (_c("bName")) {}
  
    Number("" + _c("cName"));
    Number("" + "");
    Object.keys({
      name: ""
    }).length;
  
    if (Object.keys({
      name: _c("bName")
    }).length) {}
  
    Object.keys({
      name: _c("bName")
    }).length ? _c("bName1") : _c("bName2");
    Object.keys({
      name: _c("bName")
    }).length ? _c("bName1") : _c("bName2");
    Object.keys({
      name: ""
    });
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
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
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    if (_c("a") || _c("b")) {
      _c("a") || _c("b");
    }

    if (_c("c")) {}

    ({
      active: ""
    });
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should Keep the options in the ternary operation', function () {
    const input = `
    global.currentInject = {
      render: function () {
        a;
        b;
        c;
        if (a ? b : c) {}
        a;
        b;
        c;
      }
    };`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    _c("b");
  
    _c("c");
    
    if (_c("a") ? _c("b") : _c("c")) {}
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should needCollect config is correct', function () {
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
          
          name4 && name4.length;
          name4['length']
          !name4.length;
          
          name5;
          this._p(name5);
          
          name6;
          name7;
          name6 + name7;
          name6 + '123';
          '123' + name7;
          '123' + name7 + name6;
          name6 + '123' + name7 + name6;
        }
      }
    `
    const res = bindThis(input, { needCollect: false, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    this.name;
    this.name3[this.name2];
    this.name4 && this.name4.length;
    this.name5;
    this.name6;
    this.name7;
    "" + "";
    "" + '123';
    '123' + "";
    '123' + "" + "";
    "" + '123' + "" + "";
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should propKeys is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          this._p(a);
          this._p(a + b);
          this._p(a && c);
          this._p(a || d);
          this._p(name.b.c && name2.b);
        }
      }
    `
    const res = bindThis(input, { renderReduce: true })
    const output = ['b', 'a', 'c', 'a', 'd', 'name', 'name2']
    expect(res.propKeys.join('')).toBe(output.join(''))
  })

  it('should logicalExpression is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          a
          a || ''
          a && a.b
          b
          b || 123 || ''
          '456' || b || ''
          '' || 123 || b
          b || a || ''
        }
      }
    `
    const res = bindThis(input, { needCollect: false, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    this.a && this.a.b;
    '' || 123 || this.b;
    this.b || this.a || '';
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should scope var is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          this._i(list, function (item, index) {
            item;
            index;
            item.a ? "" : item.b;
            item.a || "";
            item.a || item.b;
          });
        }
      }
    `
    const res = bindThis(input, { needCollect: false, renderReduce: true }).code
    const output = `
global.currentInject = {
  render: function () {
    this._i(this.list, function (item, index) {
      item.a ? "" : item.b;
      item.a || item.b;
    });
  }
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })
})
