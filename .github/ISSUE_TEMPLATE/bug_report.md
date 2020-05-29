---
name: Bug report
about: 框架Bug反馈
title: "[Bug report]"
labels: ''
assignees: ''

---

**问题描述**  
请用简洁的语言描述你遇到的bug，至少包括以下部分，如提供截图请尽量完整：
1. 问题触发的条件
2. 期望的表现
3. 实际的表现

**环境信息描述**  
至少包含以下部分：
1. 系统类型(Mac或者Windows)
2. Mpx依赖版本(@mpxjs/core、@mpxjs/webpack-plugin和@mpxjs/api-proxy的具体版本，可以通过package-lock.json或者实际去node_modules当中查看)
3. 小程序开发者工具信息(小程序平台、开发者工具版本、基础库版本)
4. 开发者工具复现还是真机复现？

**最简复现demo**  
一般来说通过文字和截图的描述我们很难定位到问题，为了帮助我们快速定位问题并修复，请按照以下指南编写并上传最简复现demo：
1. 根据现有项目遇到的问题，尝试精简代码，确定问题的最小复现条件
2. 使用脚手架创建新项目，基于最小复现条件编写稳定的最简复现demo
3. 删除项目中的node_modules部分，打包项目，并拖拽到issue输入框中上传（或提供远程可下载地址）
