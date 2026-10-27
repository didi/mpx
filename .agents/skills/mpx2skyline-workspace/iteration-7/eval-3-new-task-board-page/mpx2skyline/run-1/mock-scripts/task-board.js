"use strict";

var _core = require("@mpxjs/core");
(0, _core.createPage)({
  initData: {
    categoryOptions: [],
    category: '全部',
    boardRating: 0,
    refreshing: false,
    visibleTasks: []
  },
  setup(__props, __context) {
    const useContext = () => {
      return __context;
    };
    function initialTasks() {
      return [{
        taskKey: 't1',
        title: '整理本周跨团队协作事项与上线验收清单',
        category: '工作',
        completed: false
      }, {
        taskKey: 't2',
        title: '购买周末出行用品',
        category: '生活',
        completed: false
      }, {
        taskKey: 't3',
        title: '完成每日阅读',
        category: '生活',
        completed: true
      }];
    }
    const categoryOptions = [{
      label: '全部',
      value: '全部'
    }, {
      label: '工作',
      value: '工作'
    }, {
      label: '生活',
      value: '生活'
    }];
    const tasks = (0, _core.ref)(initialTasks());
    const category = (0, _core.ref)('全部');
    const boardRating = (0, _core.ref)(0);
    const refreshing = (0, _core.ref)(false);
    const refreshError = (0, _core.ref)('');
    const visibleTasks = (0, _core.computed)(() => tasks.value.filter(task => category.value === '全部' || task.category === category.value));
    let nextTaskId = 4;
    let refreshShouldFail = false;
    const windowHeight = (0, _core.ref)(0);
    const statusBarHeight = (0, _core.ref)(0);
    const navigationHeight = (0, _core.ref)(44);
    const capsuleInset = (0, _core.ref)(0);
    const bottomInset = (0, _core.ref)(0);
    function updateWindow() {
      const info = wx.getWindowInfo();
      const capsule = wx.getMenuButtonBoundingClientRect();
      windowHeight.value = info.windowHeight;
      statusBarHeight.value = info.statusBarHeight;
      navigationHeight.value = capsule.height + (capsule.top - info.statusBarHeight) * 2;
      capsuleInset.value = info.windowWidth - capsule.left;
      bottomInset.value = info.safeArea ? info.screenHeight - info.safeArea.bottom : 0;
    }
    updateWindow();
    (0, _core.onResize)(updateWindow);
    (0, _core.onLoad)(query => {
      category.value = categoryOptions.some(option => option.value === query.category) ? query.category : '全部';
      // 测试入口：页面参数 refreshFail=1 注入模拟请求失败。
      refreshShouldFail = query.refreshFail === '1';
    });
    function goHome() {
      wx.reLaunch({
        url: '/pages/home'
      });
    }
    function onCategoryChange(event) {
      if (event.detail.controlKey === 'category') category.value = event.detail.value;
    }
    function onRatingChange(event) {
      if (event.detail.ratingKey === 'board') boardRating.value = event.detail.value;
    }
    function toggleTask(event) {
      const task = tasks.value.find(task => task.taskKey === event.currentTarget.dataset.taskKey);
      if (task) task.completed = !task.completed;
    }
    async function onRefresh() {
      if (refreshing.value) return;
      refreshing.value = true;
      refreshError.value = '';
      try {
        const restoredTasks = await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (refreshShouldFail) reject(new Error('模拟请求失败'));else resolve(initialTasks());
          }, 300);
        });
        tasks.value = restoredTasks;
        boardRating.value = 0;
      } catch (error) {
        refreshError.value = '刷新失败，请下拉重试；现有任务可继续使用';
      } finally {
        refreshing.value = false;
      }
    }
    function onLoadMore() {
      if (refreshing.value) return;
      const taskCategory = category.value === '全部' ? '工作' : category.value;
      const appendedTasks = [0, 1].map(() => {
        const id = nextTaskId++;
        return {
          taskKey: 't' + id,
          title: taskCategory + '新增任务 ' + id,
          category: taskCategory,
          completed: false
        };
      });
      tasks.value = tasks.value.concat(appendedTasks);
    }
    return {
      categoryOptions,
      category,
      boardRating,
      visibleTasks,
      refreshing,
      refreshError,
      windowHeight,
      statusBarHeight,
      navigationHeight,
      capsuleInset,
      bottomInset,
      goHome,
      onCategoryChange,
      onRatingChange,
      toggleTask,
      onRefresh,
      onLoadMore
    };
  }
});