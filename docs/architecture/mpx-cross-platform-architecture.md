# MPX 跨端架构图

## 1. 整体架构图

```mermaid
flowchart TB
    subgraph Developer["开发者"]
        Code["微信语法源码<br/>.mpx/.js/.json/.css"]
    end

    subgraph BuildSystem["MPX 构建系统"]
        WP["Webpack"]
        MPXPlugin["mpx-webpack-plugin"]
        Loader["mpx-loader"]
        TemplateCompiler["模板编译器"]
        StyleCompiler["样式编译器"]
        JSONCompiler["JSON编译器"]
    end

    subgraph OutputPlatforms["输出平台"]
        subgraph MiniPrograms["小程序平台"]
            WX["微信"]
            ALI["支付宝"]
            BAIDU["百度"]
            TT["字节"]
            QQ["QQ"]
            JD["京东"]
            DD["钉钉"]
            KS["快手"]
            QA["快应用"]
        end

        subgraph CrossEnd["跨端平台"]
            WEB["H5/Web"]
            RN["React Native<br/>iOS/Android"]
            HARMONY["鸿蒙"]
        end
    end

    subgraph Runtime["运行时 Runtime"]
        Core["@mpxjs/core"]
        APIProxy["@mpxjs/api-proxy"]
        Store["@mpxjs/store"]
        Pinia["@mpxjs/pinia"]
    end

    Code --> WP
    WP --> MPXPlugin
    MPXPlugin --> Loader
    Loader --> TemplateCompiler
    Loader --> StyleCompiler
    Loader --> JSONCompiler

    TemplateCompiler --> WX
    TemplateCompiler --> ALI
    TemplateCompiler --> BAIDU
    TemplateCompiler --> WEB
    TemplateCompiler --> RN

    StyleCompiler --> WX
    StyleCompiler --> ALI
    StyleCompiler --> WEB

    Core --> MiniPrograms
    Core --> CrossEnd
    APIProxy --> MiniPrograms
    APIProxy --> CrossEnd
```

## 2. 核心包架构

```mermaid
flowchart LR
    subgraph mpxjs["@mpxjs/*"]
        core["core<br/>核心运行时"]
        webpackPlugin["webpack-plugin<br/>构建插件"]
        apiProxy["api-proxy<br/>API代理"]
        store["store<br/>状态管理"]
        pinia["pinia<br/>Pinia集成"]
        fetch["fetch<br/>网络请求"]
        utils["utils<br/>工具函数"]
        webviewBridge["webview-bridge<br/>桥接层"]
    end
```

## 3. 构建转换流程

```mermaid
flowchart TB
    subgraph Input["输入"]
        SrcCode["源码<br/>微信语法"]
        MPXFile[".mpx 文件"]
    end

    subgraph Compile["编译阶段"]
        Parse["解析 AST"]
        Convert["平台转换<br/>wx → ali/wx/swan/web/rn..."]
        Generate["代码生成"]
    end

    subgraph Output["输出"]
        WXML[".wxml"]
        WXSS[".wxss"]
        JS["JS"]
        JSON["JSON"]

        AXML[".axml"]
        ACSS[".acss"]

        HTML[".html"]
        CSS[".css"]

        RNJS["React Native<br/>JS Bundle"]
    end

    SrcCode --> Parse
    MPXFile --> Parse
    Parse --> Convert
    Convert --> Generate
    Generate --> WXML
    Generate --> WXSS
    Generate --> JS
    Generate --> JSON
    Generate --> AXML
    Generate --> ACSS
    Generate --> HTML
    Generate --> CSS
    Generate --> RNJS
```

## 4. 运行时平台适配

```mermaid
flowchart TB
    subgraph Runtime["运行时架构"]
        subgraph coreSrc["packages/core/src"]
            platform["platform/<br/>平台入口"]
            convertor["convertor/<br/>转换器"]
            runtime["runtime/<br/>运行时"]
            observer["observer/<br/>响应式系统"]
            dynamic["dynamic/<br/>动态渲染"]
        end

        subgraph platformDir["platform/"]
            builtInMixins["builtInMixins/<br/>内置混入"]
            exportAPI["export/<br/>导出API"]
            patch["patch/<br/>平台补丁"]
            env["env/<br/>环境变量"]
        end
    end

    subgraph platformSpecific["平台特定文件"]
        styleHelper["styleHelperMixin.ios.js<br/>styleHelperMixin.web.js"]
        proxyEvent["proxyEventMixin.web.js"]
        getDefaultOptions["getDefaultOptions.ios.js<br/>getDefaultOptions.web.js"]
        lifecycle["lifecycle/index.wx.js<br/>lifecycle/index.ali.js<br/>lifecycle/index.web.js"]
    end

    platform --> builtInMixins
    platform --> exportAPI
    platform --> patch
    platform --> env
    builtInMixins --> styleHelper
    builtInMixins --> proxyEvent
    patch --> getDefaultOptions
    env --> lifecycle
```

## 5. 平台转换矩阵

```mermaid
flowchart TB
    subgraph ConvertMode["转换模式"]
        direction TB

        subgraph fromWx["从微信源码"]
            wxAli["wx → ali<br/>支付宝"]
            wxWeb["wx → web<br/>H5"]
            wxSwan["wx → swan<br/>百度"]
            wxQq["wx → qq<br/>QQ"]
            wxTt["wx → tt<br/>字节"]
            wxJd["wx → jd<br/>京东"]
            wxDd["wx → dd<br/>钉钉"]
            wxKs["wx → ks<br/>快手"]
            wxIos["wx → ios<br/>iOS RN"]
            wxAndroid["wx → android<br/>Android RN"]
            wxHarmony["wx → harmony<br/>鸿蒙"]
        end
    end

    style wxAli fill:#f9f,stroke:#333
    style wxWeb fill:#9f9,stroke:#333
    style wxSwan fill:#ff9,stroke:#333
    style wxQq fill:#9ff,stroke:#333
    style wxTt fill:#f99,stroke:#333
    style wxJd fill:#f9f,stroke:#333
    style wxDd fill:#ff9,stroke:#333
    style wxKs fill:#9ff,stroke:#333
    style wxIos fill:#f90,stroke:#333
    style wxAndroid fill:#f90,stroke:#333
    style wxHarmony fill:#90f,stroke:#333
```

## 6. API 代理架构

```mermaid
flowchart LR
    subgraph apiProxy["packages/api-proxy/src/platform/api"]
        storage["storage/<br/>存储API"]
        network["network/<br/>网络API"]
        device["device/<br/>设备API"]
        media["media/<br/>媒体API"]
        location["location/<br/>位置API"]
        open["open/<br/>开放API"]
    end

    subgraph platformImpl["平台实现"]
        implWx["index.js<br/>微信"]
        implWeb["index.web.js<br/>Web"]
        implAli["index.ali.js<br/>支付宝"]
        implIos["index.ios.js<br/>iOS RN"]
    end

    storage --> implWx
    storage --> implWeb
    storage --> implAli
    storage --> implIos

    network --> implWx
    network --> implWeb
    network --> implAli
    network --> implIos
```

## 7. 关键文件位置

| 模块 | 路径 | 说明 |
|-----|------|-----|
| 核心入口 | `packages/core/src/index.js` | createApp/createPage/createComponent |
| Webpack插件 | `packages/webpack-plugin/lib/index.js` | 构建入口 (~90KB) |
| 平台配置 | `packages/webpack-plugin/lib/config.js` | 各平台配置 |
| 平台工具 | `packages/webpack-plugin/lib/utils/env.js` | 平台判断 |
| 转换模式 | `packages/core/src/convertor/getConvertMode.js` | 转换规则 |
| 运行时平台 | `packages/core/src/platform/index.js` | 平台入口 |
| 平台混入 | `packages/core/src/platform/builtInMixins/` | 运行时混入 |
| API代理 | `packages/api-proxy/src/index.js` | API入口 |

## 8. 支持的平台汇总

| 平台 | mode | 扩展名 | 关键文件 |
|-----|------|-------|---------|
| 微信 | wx | .wxml/.wxss | lifecycle/index.wx.js |
| 支付宝 | ali | .axml/.acss | lifecycle/index.ali.js |
| 百度 | swan | .swan/.css | lifecycle/index.swan.js |
| 字节 | tt | .ttml/.ttss | - |
| QQ | qq | .qml/.qss | - |
| 京东 | jd | .jxml/.jss | - |
| 钉钉 | dd | - | - |
| 快手 | ks | - | - |
| 快应用 | qa | - | - |
| H5 | web | .html/.css | lifecycle/index.web.js |
| iOS RN | ios | React Native | lifecycle/index.ios.js |
| Android RN | android | React Native | - |
| 鸿蒙 | harmony | - | - |
