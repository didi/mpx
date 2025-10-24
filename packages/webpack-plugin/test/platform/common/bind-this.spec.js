const bindThis = require('../../../lib/template-compiler/bind-this').transform
const { trimBlankRow } = require('../../../lib/utils/string')

describe('render function simplify should correct', function () {
  it('should normal delete is correct', function () {
    const input = `
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
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
        mpx_i(obj3, function() {})

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
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
  if (mpx_sc("a")) {}

  mpx_sc("b");
  mpx_sc("c");

  mpx_sc("a") ? "" : "";
  mpx_sc("a") && mpx_sc("b");

  mpx_sc("d");

  mpx_sc("e");

  mpx_sc("a") ? "" : "";

  if (mpx_sc("f") + mpx_sc("g")) {}

  mpx_sc("obj1");

  mpx_sc("obj2");

  mpx_i(mpx_sc("obj3"), function () {});

  mpx_sc("obj5");

  mpx_sc("name");

  mpx_sc("nameage");

  mpx_sc("handlerName");

  ({
    tap: [["handler", true, 123]],
    click: [["handler", ""]]
  });

  mpx_sc("aName");

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
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
        a.b
        if (a['b']) {}
        c;
        a[c];
        c.d;
        a.b[c.d];

        e1[0].name;
        e2["a.b.c"]
        f1["a.b.c"]["d"]
        f2["a"]["b.c.d"]
        g1.a["b.c"].d
        g2.a["b"].c.d
        g3.a["b"]["c.d"].e
      }`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
  if (mpx_c("a.b")) {}

  mpx_sc("a")[mpx_sc("c")];
  mpx_c("a.b")[mpx_c("c.d")];

  mpx_c("e1[0].name");
  mpx_sc("e2")["a.b.c"];
  mpx_sc("f1")["a.b.c"]["d"];
  mpx_c("f2.a")["b.c.d"];
  mpx_c("g1.a")["b.c"].d;
  mpx_c("g2.a.b.c.d");
  mpx_c("g3.a.b")["c.d"].e;
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should expression delete is correct', function () {
    const input = `
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
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
        mpx_i([obj13, obj14], function() {});
      }`
    const res = bindThis(input, { needCollect: true, renderReduce: true }).code
    const output = `
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
  // 逻辑运算          
  mpx_sc("obj3") || '';
  mpx_sc("obj3") && mpx_c("obj3.b");

  mpx_sc("obj4");
  '' || 123 || mpx_sc("obj4");
  mpx_sc("obj5") || 123 || '';
  
  mpx_sc("obj6");
  mpx_sc("obj6") || mpx_sc("obj7") || '';

  mpx_sc("a1");
  mpx_sc("b1");

  mpx_sc("c1");

  mpx_sc("a1") || mpx_sc("b1") || mpx_sc("c1");

  mpx_sc("a2");
  mpx_sc("b2");

  mpx_sc("a2") || mpx_sc("b2") || '';

  mpx_sc("a3");
  mpx_sc("c3");

  mpx_sc("a3") || '' || mpx_sc("c3");

  mpx_sc("a4");

  mpx_sc("b5");

  mpx_sc("c5");

  mpx_sc("a5") && mpx_sc("b5");

  if (mpx_sc("a5") && mpx_sc("b5")) {}

  if (mpx_sc("a5") ? mpx_sc("b5") : mpx_sc("c5")) {}
  
  mpx_sc("a6") ? mpx_sc("b6") : mpx_sc("c6"); // b6 c6只出现一次，不会被删除

  mpx_sc("b7");
  mpx_sc("a7") ? "" : mpx_sc("c7");

  mpx_sc("obj8");
  "" + 'rpx';
  'height:' + "" + 'rpx';
  'height' + ':' + "";
  
  mpx_sc("obj9");

  mpx_sc("obj10");

  mpx_sc("obj11");

  mpx_sc("obj12");

  mpx_sc("obj9") || mpx_sc("obj10") || mpx_sc("obj11") && mpx_sc("obj12");

  mpx_i([mpx_sc("obj13"), mpx_sc("obj14")], function () {});
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should backtrack variable deletion is correct', function () {
    const input = `
    global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
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
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
  mpx_sc("a");

  {
    mpx_sc("c");

    {}

    mpx_sc("aa"); // 分割线


    {
      mpx_sc("d");
    }
  }

  mpx_sc("b");

};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should scope var is correct', function () {
    const input = `
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
        this.mpx_i(list, function (item, index) {
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
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
  this.mpx_i(this.list, function (item, index) {
    item.a ? "" : "";
    item.a || item.b;
  });
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })

  it('should propKeys is correct', function () {
    const input = `
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
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
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
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
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
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
      global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
        a;
        tools.hexToRgba(a);

        b;
        tools.hexToRgba(b, 1);

        0 ? tools(c) : 1;
        0 ? tools(c, 1) : 1;
        c;

        tools(d, tools(e))
        tools(d, tools(e, 1))
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
global.currentInject.render = function (mpx_i, mpx_c, mpx_r, mpx_sc) {
  mpx_sc("a");

  mpx_sc("b");

  0 ? "" : 1;
  0 ? "" : 1;
  mpx_sc("c");

  tools(mpx_sc("d"), tools(mpx_sc("e")));
  tools(mpx_sc("d"), tools(mpx_sc("e"), 1));

  mpx_sc("a2");
  mpx_sc("a3");
  mpx_sc("a4");
  mpx_sc("a5");
  mpx_sc("a6");
  tools(mpx_sc("a1")) ? mpx_sc("a2") || (mpx_sc("a3") || mpx_sc("a4")) && mpx_sc("a5") : "";

  mpx_sc("a8");
  mpx_sc("a9");
  mpx_sc("a10");
  mpx_sc("a7") + '' ? "" : {
    name: "" + ""
  };
};`
    expect(trimBlankRow(res)).toBe(trimBlankRow(output))
  })
})
