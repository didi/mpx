const bindThis = require('../../../lib/template-compiler/bind-this').transform

describe('render function simplify should correct', function () {

  it('should simplify render function correct', function () {
    const input = `
function render() {

  (true);
  (false);
  if(true) {}

  (123);
  if(12) {}

  'string';
  'left' + str1;
  str2 + 'right';
  'left' + str3 + 'right';
  'repeat' + str3; // TODO 确认是否应该删除
  if('str4') {}
  if('str5' + str5) {}
  str6 && str6.name || '同意并授权'

  size === 'big1' ? 'big1' : small;
  size === big2 ? 'big2' : 'small2';
  size;
  small;
  big2;
  if (size === 'big3' ? 'left3' : 'right3') {}
  size === 'big4'
    ? level === 4
      ? 'level1'
      : 'level2'
    : 'small4'
  ((false)||(false)===undefined?'':'display:none;');

  a;
  a;
  a.b;
  a['b'];
  a.b[c];
  if (a.b) {}
  
  tip;
  this._p(tip)
  this._p(tip && msg || 'str')
  
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
}
`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
function render() {
  if (true) {}

  if (12) {}

  "" + this._c("str1", this.str1);
  this._c("str2", this.str2) + "";
  'left' + this._c("str3", this.str3) + "";
  "" + this._c("str3", this.str3); // TODO 确认是否应该删除

  if ('str4') {}
  
  if ('str5' + this._c("str5", this.str5)) {}
  
  this._c("str6", this.str6) && this._c("str6.name", this.str6.name) || '同意并授权';

  this._c("size", this.size) === 'big' ? "" : this._c("small", this.small);
  this._c("size", this.size) === this._c("big2", this.big2) ? "" : "";

  if (this._c("size", this.size) === 'big3' ? 'left3' : 'right3') {}

  this._c("size", this.size) === 'big4' ? this._c("level", this.level) === 4 ? "" : "" : "";
  
  false || false === undefined ? '' : "";

  this._c("a", this.a);

  this._c("a.b", this.a.b);

  this._c("a.b", this.a.b)[this._c("c", this.c)];

  if (this._c("a.b", this.a.b)) {}
  
  this._c("tip", this.tip);
  
  this._c("tip", this.tip) && this._c("msg", this.msg) || 'str';
  
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
}
`
    expect(res).toMatchSnapshot(output)
  })
})
