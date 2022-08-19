const bindThis = require('../../../lib/template-compiler/bind-this').transform

describe('render function simplify should correct', function () {

  it('streamline function', function () {
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
  if('str') {}

  size === 'big' ? 'big1' : small;
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

  name;
  name;
  person;
  person.age;
  person[sex];
  person['grade'];
}
`
    const res = bindThis(input, { needCollect: true }).code
    console.log(res)
    const output = `
function render() {
  if (true) {}

  if (12) {}

  "" + this._c("str1", this.str1);
  this._c("str2", this.str2) + "";
  'left' + this._c("str3", this.str3) + "";
  "" + this._c("str3", this.str3); // TODO 确认是否应该删除

  if ('str') {}

  this._c("size", this.size) === 'big' ? "" : this._c("small", this.small);
  this._c("size", this.size) === this._c("big2", this.big2) ? "" : "";

  if (this._c("size", this.size) === 'big3' ? 'left3' : 'right3') {}

  this._c("size", this.size) === 'big4' ? this._c("level", this.level) === 4 ? "" : "" : "";

  this._c("name", this.name);

  this._c("person", this.person);

  this._c("person.age", this.person.age);

  this._c("person", this.person)[this._c("sex", this.sex)];

  this._c("person.grade", this.person['grade']);
}
`
    // expect(output).toBe(res)
    expect(res).toBe(output) // TODO 改用快照
  })
})
