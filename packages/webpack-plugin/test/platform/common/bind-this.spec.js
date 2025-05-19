const bindThis = require('../../../lib/template-compiler/bind-this').transform
const { trimBlankRow } = require('../../../lib/utils/string')

describe('render function simplify should correct', function () {
  it('should normal delete is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
        a;
        if (a) {}

        b;
        c;
        a ? b : c

        a && b;

        d;
        e;
        a ? d : e
        d;
        e;
        
        f;
        g;
        if (f + g) {}
        
        obj1;
        obj1.a;
        
        obj2;
        obj2.a.b;

        obj3;
        String(obj3).b.c;
        this._p(obj3)
        String(obj3,'123').b.c
        !!!String(obj3).b.c;
        _i(obj3, function() {})

        obj5
        !obj5
        !!obj5
        !!!!!!!obj5

        name;
        nameage;
        name.age
        
        handlerName;
        ({tap:[["handler",true, 123]],click:[["handler",handlerName]]});
  
        aName;
        ({
          open: true,
          str: 'str',
          name: aName
        });
      }`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  if (_sc("a")) {}

  _sc("b");
  _sc("c");

  _sc("a") ? "" : "";
  _sc("a") && _sc("b");

  _sc("d");

  _sc("e");

  _sc("a") ? "" : "";

  if (_sc("f") + _sc("g")) {}

  _sc("obj1");

  _sc("obj2");

  String(_sc("obj3"), '123').b.c;
  _i(_sc("obj3"), function () {});

  _sc("obj5");

  _sc("name");

  _sc("nameage");

  _sc("handlerName");

  ({
    tap: [["handler", true, 123]],
    click: [["handler", ""]]
  });

  _sc("aName");

  ({
    open: true,
    str: 'str',
    name: ""
  });
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should computed delete is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
        a.b
        if (a['b']) {}
        c;
        a[c];
        c.d;
        a.b[c.d];
        e;
        e[0].name
      }`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  if (_c("a.b")) {}

  _sc("a")[_sc("c")];
  _c("a.b")[_c("c.d")];

  _sc("e");
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should expression delete is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
        // 逻辑运算          
        obj3 || ''
        obj3 && obj3.b
        obj4
        obj4 || 123 || ''
        '456' || obj4 || ''
        '' || 123 || obj4
        obj5 || 123 || ''
        obj5

        obj6
        obj6 || (obj7 || '')
        
        a1;
        b1;
        c1;
        a1 || b1 || c1;
        
        a2;
        b2;
        a2 || b2 || '';
        
        a3;
        c3
        a3 || ''
        a3 || '' || c3
        
        a4
        a4 || '' || ''
        
        a5
        b5
        c5
        a5 && b5
        if (a5 && b5) {}
        if (a5 ? b5 : c5) {}

        a6 ? b6 : c6 // b6 c6只出现一次，不会被删除
        
        b7
        a7 ? b7.name : c7

        obj8
        obj8 + 'rpx'
        'height:' + obj8 + 'rpx'
        'height' + ':' + obj8
        
        obj9
        obj10
        obj11
        obj12
        obj9 || (obj10 || obj11 && obj12)
        obj12 || ''

        obj13;
        obj14;
        _i([obj13, obj14], function() {});
      }`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  // 逻辑运算          
  _sc("obj3") || '';
  _sc("obj3") && _c("obj3.b");

  _sc("obj4");
  '' || 123 || _sc("obj4");
  _sc("obj5") || 123 || '';
  
  _sc("obj6");
  _sc("obj6") || _sc("obj7") || '';

  _sc("a1");
  _sc("b1");

  _sc("c1");

  _sc("a1") || _sc("b1") || _sc("c1");

  _sc("a2");
  _sc("b2");

  _sc("a2") || _sc("b2") || '';

  _sc("a3");
  _sc("c3");

  _sc("a3") || '' || _sc("c3");

  _sc("a4");

  _sc("b5");

  _sc("c5");

  _sc("a5") && _sc("b5");

  if (_sc("a5") && _sc("b5")) {}

  if (_sc("a5") ? _sc("b5") : _sc("c5")) {}
  
  _sc("a6") ? _sc("b6") : _sc("c6"); // b6 c6只出现一次，不会被删除

  _sc("b7");
  _sc("a7") ? "" : _sc("c7");

  _sc("obj8");
  "" + 'rpx';
  'height:' + "" + 'rpx';
  'height' + ':' + "";
  
  _sc("obj9");

  _sc("obj10");

  _sc("obj11");

  _sc("obj12");

  _sc("obj9") || _sc("obj10") || _sc("obj11") && _sc("obj12");

  _i([_sc("obj13"), _sc("obj14")], function () {});
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should backtrack variable deletion is correct', function () {
    const input = `
    global.currentInject.render = function (_i, _c, _r, _sc) {
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
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  _sc("a");

  {
    _sc("c");

    {}

    _sc("aa"); // 分割线


    {
      _sc("d");
    }
  }

  _sc("b");

};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should scope var is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
        this._i(list, function (item, index) {
          item;
          index;
          item.a ? "" : item.b;
          item.a || "";
          item.a || item.b;
        });
      }
    `
    const res = bindThis(input, { needCollect: false, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  this._i(this.list, function (item, index) {
    item.a ? "" : "";
    item.a || item.b;
  });
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should propKeys is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
        this._p(a);
        this._p(a + b);
        this._p(a && c);
        this._p(a || d);
        this._p(name.b.c && name2.b);
      }
    `
    const res = bindThis(input, { renderReduce: true })
    const output = ['a', 'b', 'c', 'd', 'name', 'name2']
    expect(res.propKeys.join('')).toBe(output.join(''))
  })

  it('should needCollect config is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
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
    `
    const res = bindThis(input, { needCollect: false, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  this.name;

  this.name3[this.name2];

  this.name4 && this.name4.length;
  this.name4['length'];

  this.name5;

  this.name6;
  this.name7;
  "" + "";
  "" + '123';
  '123' + "";
  '123' + "" + "";
  "" + '123' + "" + "";
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should wxs is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
        a;
        tools.hexToRgba(a);

        b;
        tools.hexToRgba(b, 1);

        0 ? tools(c) : 1;
        0 ? tools(c, 1) : 1;
        c;

        tools(d, tools(e))
        d;
        e;
        
        a1;a2;a3;a4;a5;a6;
        tools(a1) ? a2 || ((a3 || a4) && a5) : a6;
        a7;a8;a9;a10;
        (a7 + '') ? a8['a'] : ({name: a9 + a10})
      }
    `
    const res = bindThis(input, {
      needCollect: true,
      renderReduce: true,
      ignoreMap: {
        _i: true,
        _c: true,
        _r: true,
        tools: '../tools.wxs'
      }
    }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
  _sc("a");

  _sc("b");

  0 ? "" : 1;
  0 ? "" : 1;
  _sc("c");

  tools(_sc("d"), tools(_sc("e")));

  _sc("a2");
  _sc("a3");
  _sc("a4");
  _sc("a5");
  _sc("a6");
  tools(_sc("a1")) ? _sc("a2") || (_sc("a3") || _sc("a4")) && _sc("a5") : "";

  _sc("a8");
  _sc("a9");
  _sc("a10");
  _sc("a7") + '' ? "" : {
    name: "" + ""
  };
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })
})
