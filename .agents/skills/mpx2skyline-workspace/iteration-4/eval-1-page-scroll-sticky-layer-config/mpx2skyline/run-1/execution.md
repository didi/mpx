# 执行记录

仅读取本case input、指定Skyline Skill及按需配置/布局/组件/运行时/审计参考；输入未修改。业务输出在 ../outputs，未改仓库文件。

1. 实现后运行 Jest：初次因 Watchman 沙箱 socket 失败，原始日志 jest.log；加 --watchman=false 后通过，jest-retry.log。
2. 原始 SFC 直接运行仓库 ESLint 的解析器不支持模板，eslint.log 保留。改为提取script经 --stdin --stdin-filename orders.js 检查，发现对象属性换行问题，eslint-script.log 保留；修复后 eslint-script-retry.log 通过。service.js 在原始检查中无报错。
3. 修改格式后重复 Jest，jest-final.log 两项通过。业务实现未因断言失败修订。
4. node run-1/compile.cjs 调用仓库 Mpx template compiler parseComponent/parse/serialize，仅验证wx模板编译，生成 orders.wxml 和 compile.log。
5. 完整审计矩阵逐条人工复核，audit.json；各验证层详见 validation.json。

复现（仓库根目录作为cwd）：
```sh
node node_modules/jest/bin/jest.js --config '{"rootDir":"/private/tmp/skyline-v4-baseline/eval-1/mpx2skyline/run-1","testRegex":"orders.test.cjs$","testEnvironment":"node"}' --runInBand --watchman=false
node /private/tmp/skyline-v4-baseline/eval-1/mpx2skyline/run-1/lint.cjs
node /private/tmp/skyline-v4-baseline/eval-1/mpx2skyline/run-1/compile.cjs
```
测试文件读取输出使用 __dirname 相对 ../outputs；归档后调整上述命令路径即可。
