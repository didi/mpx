/**
 * MPX RN DEMO E2E 测试入口
 * 
 * 测试流程：
 * 1. Index Page - 首页测试
 * 2. View Component Test Page - View 组件能力测试
 * 3. Text Component Test Page - Text 组件能力测试
 * 4. Scroll-View Component Test Page - Scroll-View 组件功能测试
 * 5. Common Page - 其他功能测试
 */

describe('MPX RN DEMO e2e test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // 引入各页面测试
  require('./tests/index.test.js');
  require('./tests/view.test.js');
  require('./tests/text.test.js');
  require('./tests/scroll-view.test.js');
  require('./tests/common.test.js');
});
