/**
 * View 组件测试页面
 *
 * 性能测试说明：
 * - 单次测试 (runTestBtn): 快速预览，但结果波动较大
 * - 基准测试 (runBenchmarkBtn): 2轮预热 + 5轮测量，取中位数，结果更稳定
 *
 * 基准测试会自动计算：
 * - 中位数（推荐使用，比平均值更稳定）
 * - 平均值、标准差、变异系数(CV)
 * - CV < 10% 表示结果稳定，10-20% 一般，>20% 不稳定
 *
 * 注意：基准测试期间会禁用 Detox 同步，因为多轮 setTimeout 会导致应用一直处于 busy 状态
 */

// 基准测试的总等待时间
// 2轮预热 + 5轮测量 = 7轮
// 每轮：冷却时间(300-800ms) + 销毁延迟(100ms) + 渲染时间
// 100个view约需要25秒，预留充足时间
const BENCHMARK_WAIT_TIME = 30000;
const POLL_INTERVAL = 500; // 轮询间隔

// 辅助函数：等待基准测试完成（使用轮询方式）
async function waitForBenchmarkComplete() {
  const startTime = Date.now();

  while (Date.now() - startTime < BENCHMARK_WAIT_TIME) {
    try {
      await expect(element(by.id('benchmarkStats'))).toBeVisible();
      return; // 找到了，退出
    } catch (e) {
      // 还没完成，继续等待
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  // 超时，抛出错误
  throw new Error(`Benchmark did not complete within ${BENCHMARK_WAIT_TIME}ms`);
}

// 辅助函数：执行基准测试并验证结果
async function runBenchmarkTest(testType, expectedLabel, expectedCount = '100') {
  // 禁用 Detox 同步，因为基准测试会使用多个 setTimeout
  await device.disableSynchronization();

  try {
    await element(by.id('runBenchmarkBtn')).tap();

    // 等待到大约第3-4轮时截取"测试进行中"的截图
    // 每轮约 500ms渲染 + 300ms冷却 = 800ms，3轮约 2.4秒
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await device.takeScreenshot(`view-${testType}-running`);

    // 等待基准测试完成
    await waitForBenchmarkComplete();

    // 重新启用同步进行验证
    await device.enableSynchronization();

    await expect(element(by.id('currentTestType'))).toHaveText(expectedLabel);
    await expect(element(by.id('currentCount'))).toHaveText(expectedCount);

    // 验证统计信息已生成（使用 toExist 因为元素可能被测试区域遮挡在屏幕外）
    await expect(element(by.id('statsMedian'))).toExist();
    await expect(element(by.id('statsCV'))).toExist();

    // 截取"测试完成"的截图
    await device.takeScreenshot(`view-${testType}-complete`);
  } catch (error) {
    // 确保即使出错也重新启用同步
    await device.enableSynchronization();
    throw error;
  }
}

describe('View Component Test Page', () => {
  beforeAll(async () => {
    // 从首页点击 view 组件入口，触发 navigateTo 跳转
    await element(by.id('component-view')).tap();
    await waitFor(element(by.id('viewPage'))).toBeVisible().withTimeout(3000);
  });

  it('renders view page correctly', async () => {
    await expect(element(by.id('viewTitle'))).toHaveText('View 组件能力测试');
  });

  it('shows all test type options', async () => {
    await expect(element(by.id('testType-basic'))).toBeVisible();
    await expect(element(by.id('testType-background'))).toBeVisible();
    await expect(element(by.id('testType-shadow'))).toBeVisible();
    await expect(element(by.id('testType-radius'))).toBeVisible();
    await expect(element(by.id('testType-transform'))).toBeVisible();
    await expect(element(by.id('testType-opacity'))).toBeVisible();
    await expect(element(by.id('testType-animation'))).toBeVisible();
    await expect(element(by.id('testType-simple-view'))).toBeVisible();
    await expect(element(by.id('testType-mixed'))).toBeVisible();
  });

  it('shows count options', async () => {
    await expect(element(by.id('count-10'))).toBeVisible();
    await expect(element(by.id('count-50'))).toBeVisible();
    await expect(element(by.id('count-100'))).toBeVisible();
    await expect(element(by.id('count-500'))).toBeVisible();
    await expect(element(by.id('count-1000'))).toBeVisible();
  });

  it('shows lifecycle info section', async () => {
    await expect(element(by.id('lifecycleInfo'))).toBeVisible();
    await expect(element(by.id('currentTestType'))).toBeVisible();
    await expect(element(by.id('currentCount'))).toBeVisible();
    await expect(element(by.id('duration'))).toBeVisible();
  });

  it('shows benchmark button', async () => {
    await expect(element(by.id('runBenchmarkBtn'))).toBeVisible();
  });

  // ========== 基准测试（推荐用于性能测量）==========

  it('benchmark: basic with 100 views', async () => {
    // 默认是 basic，设置 count 为 100
    await element(by.id('count-100')).tap();
    await runBenchmarkTest('basic', 'Basic', '100');
  });

  it('benchmark: background with 100 views', async () => {
    await element(by.id('testType-background')).tap();
    await runBenchmarkTest('background', 'Background', '100');
  });

  it('benchmark: shadow with 100 views', async () => {
    await element(by.id('testType-shadow')).tap();
    await runBenchmarkTest('shadow', 'Shadow', '100');
  });

  it('benchmark: radius with 100 views', async () => {
    await element(by.id('testType-radius')).tap();
    await runBenchmarkTest('radius', 'Radius', '100');
  });

  it('benchmark: transform with 100 views', async () => {
    await element(by.id('testType-transform')).tap();
    await runBenchmarkTest('transform', 'Transform', '100');
  });

  it('benchmark: opacity with 100 views', async () => {
    await element(by.id('testType-opacity')).tap();
    await runBenchmarkTest('opacity', 'Opacity', '100');
  });

  it('benchmark: animation with 10 views (fixed)', async () => {
    await element(by.id('testType-animation')).tap();
    await runBenchmarkTest('animation', 'Animation', '10');
  });

  it('benchmark: simple-view with 100 views', async () => {
    await element(by.id('testType-simple-view')).tap();
    // animation 后 count 变成了 10，需要重新设置为 100
    await element(by.id('count-100')).tap();
    await runBenchmarkTest('simple-view', 'Simple View', '100');
  });

  it('benchmark: mixed with 100 views', async () => {
    await element(by.id('testType-mixed')).tap();
    await runBenchmarkTest('mixed', '综合', '100');
  });

  afterAll(async () => {
    // 点击页面内返回按钮，回到首页
    await element(by.id('backBtn')).tap();
    await waitFor(element(by.id('indexPage'))).toBeVisible().withTimeout(3000);
  });
});
