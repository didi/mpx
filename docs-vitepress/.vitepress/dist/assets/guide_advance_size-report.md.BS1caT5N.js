import{_ as s,c as i,o as a,a7 as n}from"./chunks/framework.CwvFaCp2.js";const c=JSON.parse('{"title":"包体积分析","description":"","frontmatter":{},"headers":[],"relativePath":"guide/advance/size-report.md","filePath":"guide/advance/size-report.md"}'),p={name:"guide/advance/size-report.md"},l=n(`<h1 id="包体积分析" tabindex="-1">包体积分析 <a class="header-anchor" href="#包体积分析" aria-label="Permalink to &quot;包体积分析&quot;">​</a></h1><p>目前业内主流小程序平台都对小程序的代码包设置了严格的体积限制，微信是单包 2MB，总包 16MB，支付宝是单包 2MB，总包 8MB；包体积作为有限的资源，在小程序业务开发中异常重要，特别对于像滴滴出行这样的大型复杂业务。</p><p>Mpx 在包体积控制上做了很多工作，主要包括：</p><ul><li><a href="./subpackage.html#分包">完善的分包支持</a></li><li><a href="./npm.html">基于依赖声明的按需构建</a></li><li><a href="./image-process.html">图像资源处理</a></li><li><a href="./../basic/css.html#公共样式复用">公共样式复用</a></li></ul><p>此外由于 Mpx 的编译构建完全基于 webpack，也能够直接复用webpack生态自带的代码压缩，模块复用，tree shaking，side effects 等能力对代码体积进行优化。</p><p>但是系统能做的工作终究有限，在一些人为不规范操作的影响下，最终输出的项目依然可能存在大量优化空间，比如在业务中不会被调用但无法被 tree shaking / side effects 移除的代码，因为 npm 依赖版本不统一造成的重复依赖，未经压缩的图像静态资源等，在大型项目中，这些问题想要被发现会非常困难，因此我们非常需要一个体积分析工具来管控项目体积和发现隐藏的体积问题。</p><h2 id="与-webpack-bundle-analyzer-的区别" tabindex="-1">与 webpack-bundle-analyzer 的区别 <a class="header-anchor" href="#与-webpack-bundle-analyzer-的区别" aria-label="Permalink to &quot;与 webpack-bundle-analyzer 的区别&quot;">​</a></h2><p><code>webpack-bundle-analyzer</code> 提供了非常完善的体积分析和可视化展示能力，但是在 Mpx 构建输出小程序场景下，其所提供的能力还是有所缺失：</p><ul><li>只能对 js 资源进行模块体积分析，而小程序的输出中包含了大量的非 js 静态资源，如 wxss / wxml / json 等，这些资源的体积都不会被统计分析；</li><li>没有针对某个分包进行体积分析的能力，由于小程序中存在对单一分包的体积限制，我们的体积往往会集中在主包和主要业务分包中，以分包维度进行体积分析的能力非常必要；</li><li>无法以特定的输入范围为维度进行体积的统计分析，这个能力诉求更多地出现在跨团队合作的复杂小程序当中，如滴滴出行。在这种场景下，接入合作的各方会更加关注己方引入的体积，并进行针对性地优化。</li></ul><p>由于上述原因，我们提供了<code>@mpxjs/size-report</code>插件提供包体积分析能力，弥补了 <code>webpack-bundle-analyzer</code> 的能力缺失，为业务提供了便捷准确的包体积管控优化抓手。</p><h2 id="使用方法" tabindex="-1">使用方法 <a class="header-anchor" href="#使用方法" aria-label="Permalink to &quot;使用方法&quot;">​</a></h2><h4 id="安装插件" tabindex="-1">安装插件 <a class="header-anchor" href="#安装插件" aria-label="Permalink to &quot;安装插件&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>npm i @mpxjs/size-report --save-dev</span></span></code></pre></div><h4 id="配置插件" tabindex="-1">配置插件 <a class="header-anchor" href="#配置插件" aria-label="Permalink to &quot;配置插件&quot;">​</a></h4><p>在项目 webpack.config 文件中配置使用 <code>@mpxjs/size-report</code> 插件即可使用，简单示例如下：</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// vue.config.js</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> MpxSizeReportPlugin</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> require</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;@mpxjs/size-report&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">module</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">exports</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> defineConfig</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">({</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">  configureWebpack</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      plugins: [</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        new</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> MpxSizeReportPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">          {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 本地可视化服务相关配置</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              server: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  enable: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 是否启动本地服务，非必填，默认 true</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  autoOpenBrowser: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 是否自动打开可视化平台页面，非必填，默认 true</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  port: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 本地服务端口，非必填，默认 0(随机端口)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  host: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;127.0.0.1&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 本地服务host，非必填</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              },</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 体积报告生成后输出的文件地址名，路径相对为 dist/wx 或者 dist/ali</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              filename: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;../report.json&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 配置阈值，此处代表总包体积阈值为 16MB，分包体积阈值为 2MB，超出将会触发编译报错提醒，该报错不阻断构建</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              threshold: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  size: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;16MB&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  packages: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;2MB&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              },</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 配置体积计算分组，以输入分组为维度对体积进行分析，当没有该配置时结果中将不会包含分组体积信息</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              groups: [</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  {</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                      // 分组名称</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      name: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;vant&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                      // 配置分组 entry 匹配规则，小程序中所有的页面和组件都可被视为 entry，如下所示的分组配置将计算项目中引入的 vant 组件带来的体积占用</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      entryRules: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                          include: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;@vant/weapp&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      name: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;pageGroup&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                      // 每个分组中可分别配置阈值，如果不配置则表示</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      threshold: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;500KB&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      entryRules: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                          include: [</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;src/pages/index&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;src/pages/user&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      name: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;someSdk&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      entryRules: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                          include: [</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;@somegroup/someSdk/index&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;@somegroup/someSdk2/index&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      },</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                      // 有的时候你可能希望计算纯 js 入口引入的体积（不包含组件和页面），这种情况下需要使用 noEntryModules</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      noEntryModules: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                          include: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;src/lib/sdk.js&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              ],</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 是否收集页面维度体积详情，默认 false</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              reportPages: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 是否收集资源维度体积详情，默认 false</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              reportAssets: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 是否收集冗余资源，默认 false</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              reportRedundance: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">              // 展示某些分包资源的引用来源信息，默认为 []</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">              showEntrysPackages: [</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;main&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">          }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      )</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      ]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">})</span></span></code></pre></div><p>参考上述示例进行配置后，构建代码后，dist 目录下会产出 report.json 文件，里边是项目的具体体积信息，关于输入 json 的简单示例如下：</p><div class="language-html vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">html</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    // 项目体积概要，大部分情况下，我们只需要看这部分就足够了</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    &quot;sizeSummary&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        // 分组体积概要，与上述配置文件中的 groups 对应</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;groups&quot;: [</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;name&quot;: &quot;vant&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                // 只有该分组包含的模块体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;selfSize&quot;: &quot;164.75KiB&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;selfSizeInfo&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  // 该分组所占 shansong</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  &quot;shansong&quot;: &quot;164.75KiB&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;sharedSize&quot;: &quot;885.68KiB&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;sharedSizeInfo&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                  &quot;main&quot;: &quot;885.68KiB&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        ],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        // 项目各个分包以及主包体积概要</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;sizeInfo&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;main&quot;: &quot;1000KiB&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;fenbao1&quot;: &quot;200kiB&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        // 项目总体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;totalSize&quot;: &quot;13468.85KiB&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        // 项目静态资源总体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;staticSize&quot;: &quot;4880.58KiB&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        // 项目chunk 文件总体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;chunkSize&quot;: &quot;8587.70KiB&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        // 非依赖项体积大小</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;copySize&quot;: &quot;1KiB&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    // 分组资源详细体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    &quot;groupsSizeInfo&quot;: [</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;name&quot;: &quot;groupOne&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // group 自身包含的 module 详情列表</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;selfEntryModules&quot;: [],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // group 与其他group 共有的 module 详情列表</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;sharedEntryModules&quot;: [],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // 自身包含 module 体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;selfSize&quot;: &quot;&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // 自身包含 module 体积详情</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;selfSizeInfo&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;main&quot;: {},</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;homepage&quot;: {}</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // 与其他 group 共有 module 体积</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;sharedSize&quot;: &quot;&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // 与其他 group 共有 module 体积详情</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;sharedSizeInfo&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;main&quot;: {},</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">                &quot;homepage&quot;: {}</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            },</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    ],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    // 项目资源详细体积报告</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    &quot;assetsSizeInfo&quot;: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        &quot;assets&quot;: [{</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // 资源类型</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;type&quot;: &quot;chunk&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;name&quot;: &quot;test&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            // 分包名</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;packageName&quot;: &quot;main&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;size&quot;: &quot;&quot;,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            &quot;modules&quot;: []</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        }]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>与此同时，如果你开启了本地可视化平台服务，可以直接通过可视化平台查看项目体积构成。默认开启自动打开平台网页或者手动打开后，整体页面展示如下图：</p><p><a href="https://mpxjs.cn" target="_blank" rel="noreferrer"><img src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/feat1.png" alt="size-report"></a></p><p>可视化平台中包含三部分功能，第一个体积分析如上图所示，主要是展示整体项目的体积总览，以及 group 体积列表和分包体积列表。</p><p>第二个功能是体积详情模块，在该模块中，可以最小颗粒度的查看包体积构成，通过 table 表格的层层展开可看到每个 group 中包含的分包，点击分包可看到该分包包含的静态资源和 js 模块详细列表，同时聚合模式可将分散的模块整合为具体的npm包名，方便宏观查看。此外为了方便用户定向查看某个特定资源的分布情况，列表上方可进行资源路径/名称搜索，该搜索支持模糊匹配，搜索结果为该资源在项目中 group 和 分包的分布情况。</p><p><a href="https://mpxjs.cn" target="_blank" rel="noreferrer"><img src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/feat2.png" alt="size-report"></a></p><p>第三个功能为体积对比功能，这里主要进行项目不同版本之间的体积大小变化比较，体积对比依赖插件生成的json文件，通过该功能，可具体的分析出包体积具体增大的group，分包，以及模块，给包体积优化提供定向目标。</p><p><a href="https://mpxjs.cn" target="_blank" rel="noreferrer"><img src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/feat3.png" alt="size-report"></a></p><h2 id="业务实践" tabindex="-1">业务实践 <a class="header-anchor" href="#业务实践" aria-label="Permalink to &quot;业务实践&quot;">​</a></h2><p>目前 sizeReport 工具在滴滴出行小程序, 花小猪, 青桔骑行, 特惠出行小程序以及一部分外部小程序中使用。</p><p>在滴滴出行小程序中，配置使用 @mpxjs/size-report 插件后使包体积管控和优化更加工程化：</p><ul><li><p>在 sizeReport 检测结果文件中，通过对 groupsSizeInfo 和 assetsSizeInfo 中assets 与 module 体积分析，我们发现了部分体积较大图片文件和css资源，通过将图片存 CDN 和删除冗余文件；</p></li><li><p>基于各小程序平台对小程序总包，主包，分包有大小限制的原则，给各接入方配置了主包和首页分包体积大小占比阈值，在构建时检测到包体积超过阈值时，抛出 error 阻断构建，开发者可通过 size-report.json 中详细的包体积分析准确的找到体积变动点。</p></li></ul><h2 id="总结" tabindex="-1">总结 <a class="header-anchor" href="#总结" aria-label="Permalink to &quot;总结&quot;">​</a></h2><p>Mpx sizeReport 工具对小程序体积计算有更细微(模块级别)的体积展示。 更加适合小程序开发场景的包体积分析。</p>`,31),t=[l];function e(h,k,E,r,d,o){return a(),i("div",null,t)}const y=s(p,[["render",e]]);export{c as __pageData,y as default};
