# 任务看板
创建 pages/task-board.mpx（script setup），提供全部/待办/完成筛选以及带稳定id的任务列表，初始数据[{id:1,title:'确认行程',done:false},{id:2,title:'查看账单',done:true}]。
使用ref/computed管理数据；切换筛选即时更新列表，点击任务切换完成状态；空列表显示暂无任务。下拉刷新恢复初始数据并结束刷新态；触底追加新id的待办任务。长标题单行省略。
自定义导航标题任务看板，主体占满剩余高度并可滚动。使用原子类为主，不要求空style区块；为Skyline专属或伪元素替换增加少量普通样式可以。项目已有UnoCSS，当前可用类在 utilities.css 中给出，无需安装插件。
