# 16次执行的检查证据汇总

本表只汇总已完成执行的真实检查日志，不重跑或修复任何测试，也不重新给48条能力断言评分。ESLint、Jest、Node VM和片段编译检查均不等于完整业务工程构建或真机运行。微信两种renderer、支付宝两类设备系统、RN三端及浏览器实际交互全部未验证。

**不能称全部检查通过：case4 noskill最终Jest为27/28，按三次修订上限停止后仍有Web `bindconfirm`兼容警告导致的失败。**

日志行号均指各组`run-1/agent.jsonl`。下表Jest为不同批次的最终结果，重复成功复验不累加；公共框架用例可能跨case重复，因此不报告不可靠的“全局唯一测试总数”。

| Case / 组 | ESLint最终 | Jest原运行最终批次（suite；tests） | 未通过检查 / 三次修复上限 |
| --- | --- | --- | --- |
| 0 / mpx | 通过；:51 | 交付 1通过/0失败/1总suite；22通过/0失败/0跳过/22总tests（:50） | 未触发停止上限 |
| 0 / noskill | 通过；:75 | 公共现有 3通过/0失败/3总suite；25通过/0失败/0跳过/25总tests（:60） | Jest链未触发；混合Node脚本适用范围unknown |
| 1 / mpx | 通过；:88 | 交付 1通过/0失败/1总suite；9通过/0失败/0跳过/9总tests（:97） | 未触发停止上限 |
| 1 / noskill | 通过；:73 | 交付 1通过/0失败/1总suite；16通过/0失败/0跳过/16总tests（:73）；公共现有 2通过/0失败/2总suite；37通过/0失败/0跳过/37总tests（:75） | 第3次修订后通过 |
| 2 / mpx | 通过；:103 | 交付 1通过/0失败/1总suite；15通过/0失败/0跳过/15总tests（:103） | 未触发停止上限 |
| 2 / noskill | 通过；:112 | 公共现有 4通过/0失败/4总suite；22通过/0失败/0跳过/22总tests（:113） | 未触发停止上限 |
| 3 / mpx | 通过；:83 | 交付 1通过/0失败/1总suite；16通过/0失败/0跳过/16总tests（:75） | 未触发停止上限 |
| 3 / noskill | 通过；:107 | 交付 1通过/0失败/1总suite；25通过/0失败/0跳过/25总tests（:98）；公共现有 3通过/0失败/3总suite；33通过/0失败/0跳过/33总tests（:90） | 未触发停止上限 |
| 4 / mpx | 通过；:72 | 交付 1通过/0失败/1总suite；31通过/0失败/0跳过/31总tests（:73） | 未触发停止上限 |
| 4 / noskill | 通过；:82 | 交付 0通过/1失败/1总suite；27通过/1失败/0跳过/28总tests（:80） | 仍失败并停止 |
| 5 / mpx | 通过；:52 | 交付 1通过/0失败/1总suite；9通过/0失败/0跳过/9总tests（:53） | 未触发停止上限 |
| 5 / noskill | 通过；:79, :75 | 交付 1通过/0失败/1总suite；18通过/0失败/0跳过/18总tests（:79） | 第3次修订后通过 |
| 6 / mpx | 通过；:70 | 交付 1通过/0失败/1总suite；13通过/0失败/0跳过/13总tests（:64） | 未触发停止上限 |
| 6 / noskill | 通过；:111 | 交付 1通过/0失败/1总suite；18通过/0失败/0跳过/18总tests（:96）；公共现有 8通过/0失败/8总suite；92通过/0失败/0跳过/92总tests（:90） | 未触发停止上限 |
| 7 / mpx | 通过；:108 | 交付 1通过/0失败/1总suite；6通过/0失败/1跳过/7总tests（:87） | 未触发停止上限 |
| 7 / noskill | 通过；:83, :78 | 交付 1通过/0失败/1总suite；13通过/0失败/0跳过/13总tests（:68） | 未触发停止上限 |

## 不能遗漏的最终失败

case4 noskill：`eval-4-account-search/noskill/run-1/agent.jsonl:80`，退出码1，1 suite failed、27 tests passed、1 failed、28 total。失败是Web输入框`bindconfirm`不受支持的warning使`expect(warn.mock.calls).toEqual([])`不成立。`:82` ESLint退出0；`:83`执行者明确停止修复；`outputs/verification.md:103、108、119`保留诊断及三次修订清单。该run的`returncode=0`只代表执行者交付完成。

## SSR HTTP补充检查与原运行分开记录

case7 mpx原执行`agent.jsonl:87`是6通过/1跳过，最初HTTP项在`:82`因监听EPERM失败，不能改写成原运行7项全通过。主Agent在允许监听的环境用`RUN_HTTP_INTEGRATION=1`并按名称只补跑该HTTP项，`validation/case7-mpx-http-jest.json:1`记录1通过、6因名称过滤跳过。原6项与补跑HTTP合起来，7个不同测试均有通过证据；这是Node HTTP适配检查，仍不是完整SSR HTML/hydration或浏览器验证。JSON的supplementary_checks单列该来源，不并入原run的Jest批次。

## 三次修订与历史失败

连续检查失败链按真实日志保守计数，启动环境问题也纳入，与case4执行者记录一致；这不是新增修订机会。case1 noskill为`:61`Watchman、`:63`缺postcss、`:69`生成代码格式断言失败，三次修订后`:73`通过。case5 noskill为`:55`Watchman、`:59`异步loader调用、`:63`Babel入口等检查失败，三次修订后`:68`通过，最终`:79`复验通过。两者达到第三次且已通过，未触发“仍失败应停止”的条件。case4 noskill为`:56→61→71→80`，第三次修订后仍失败，停止条件确实触发。其余Jest链未见超限继续修复；Node混合验证脚本的边界另见下述unknown，不把其历史省略。详细历史及缺失计数保留在JSON。

case0 noskill的混合Node配置/resolver/lint验证脚本还存在`:51→59→66→71→75`，四次修订后才通过；其中后两轮是ESLint结果断言失败。若把整个混合脚本界定为单元测试，会有超过三次修订的疑点；原指引只限制单元测试，是否涵盖依赖/lint接入不能仅凭日志可靠确认，保留unknown。JSON另列other_check_history与policy_ambiguities，不借最终通过掩盖该过程。

ESLint历史失败（SFC提取、Babel配置、格式或命令参数）不会被删去，但表中报告最终真实结果；无输出且退出0的CLI只记录通过，不虚构检查数量。纯Node VM检查不转换为Jest数量。

- Case 0 / noskill：交付自己的配置/真实resolver/标签检查使用node checks/verify.cjs，不是Jest用例数。

- Case 1 / noskill：三次修订后最终成功；包括Watchman、postcss依赖路径和编译结果格式断言问题。

- Case 2 / noskill：14项交付业务检查是Node VM断言（agent.jsonl:92），不是Jest测试；最终补充VM检查见:111。

- Case 3 / mpx：真实多目标编译尝试在agent.jsonl:51退出2，缺mpx-cli；没有进入构建。

- Case 4 / noskill：ESLint最终通过；Jest仍1 suite失败，27/28通过；Web bindconfirm兼容警告未解决。

- Case 5 / mpx：agent.jsonl:41的真实编译尝试缺mpx-cli，未构建。

- Case 5 / noskill：三次修订后最终成功；初始Watchman、loader调用和Babel依赖问题均在日志保留。

- Case 6 / noskill：初始Watchman启动失败与Babel依赖入口失败，经两次修订后通过。

- Case 7 / mpx：原运行6通过/1跳过：HTTP监听EPERM失败后将真实HTTP测试改为显式opt-in；这项不能在原运行中算通过。 主Agent事后在允许监听环境只补跑HTTP测试成功；原6项和补跑HTTP共7个不同测试已有通过证据，见supplementary_checks，仍非真实SSR HTML/hydration集成验收。

- Case 7 / noskill：原环境vue-demi处于Vue3模式，导致hasInjectionContext错误；仅在测试配置映射到该依赖自带lib/v2.7/index.cjs，未改公共依赖。 测试使用真实Vue2.7/Pinia2.3.1，但将@mpxjs/core响应式和@mpxjs/pinia Web桥接映射为对应Vue/Pinia，页面脚本在VM执行，renderer为模拟；通过不能等同真实SSR HTML/hydration。

最终状态：ESLint 16/16通过；原运行Jest 14组通过、1组通过但有skip、1组失败。case0 noskill混合Node脚本的三次上限适用范围另保留unknown。
完成证据核对：16 /16。完整业务构建与真机：未验证。
