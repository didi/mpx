# 执行记录

只读取指定 input/task.md、三个输入资源，以及指定 Skyline SKILL.md 与任务相关参考章节、完整审计矩阵。输入和 Skill 未改写或复制。

实现输出在 ../outputs。Jest 用例使用 __dirname 相对 ../outputs 读取资源，VM 仅 mock createComponent、微信调用和 SelectorQuery；没有 Mpx 真实实例或设备运行。

执行命令（仓库根目录）：

```sh
node node_modules/jest/bin/jest.js --config /private/tmp/skyline-v4-baseline/eval-2/mpx2skyline/run-1/jest.config.json --runInBand --watchman=false
node node_modules/eslint/bin/eslint.js --no-eslintrc --env es6 --global wx --parser-options '{"ecmaVersion":2020,"sourceType":"module"}' --rule 'no-unused-vars:error' --rule 'no-undef:error' /private/tmp/skyline-v4-baseline/eval-2/mpx2skyline/run-1/component-script.js
```

初次 5 通过、1 失败（静态断言正则中的 {{1}} 未转义，量词解释导致误报），修复一次测试后 6 通过。原日志 jest-attempt-1.log，最终 jest.log；ESLint exit 0，eslint.log 无输出。分层结论见 validation.json，完整矩阵审计见 audit.json。编译与真机均未执行。
