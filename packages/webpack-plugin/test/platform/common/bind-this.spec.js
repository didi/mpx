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
        !!!String(obj3).b.c;

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
      }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = ``
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
      }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = ``
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

        // 二进制表达式
        obj5 + 'rpx'
        'height:' + obj5 + 'rpx'
        'height' + ':' + obj5
      }
    `
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = ``
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
    item.a ? "" : item.b;
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
    const output = ['b', 'a', 'c', 'a', 'd', 'name', 'name2']
    expect(res.propKeys.join('')).toBe(output.join(''))
  })

  it('should needCollect config is correct', function () {
    const input = `
      global.currentInject.render = function (_i, _c, _r, _sc) {
         
      }
    `
    const res = bindThis(input, { needCollect: false, renderReduce: true }).code
    const output = `
global.currentInject.render = function (_i, _c, _r, _sc) {
   
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

})
