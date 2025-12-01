/**
 * Text 组件测试页面
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
// 100个text约需要25秒，预留充足时间
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

    // 等待基准测试完成
    await waitForBenchmarkComplete();

    // 重新启用同步进行验证
    await device.enableSynchronization();

    await expect(element(by.id('currentTestType'))).toHaveText(expectedLabel);
    await expect(element(by.id('currentCount'))).toHaveText(expectedCount);

    // 验证统计信息已生成（使用 toExist 因为元素可能被测试区域遮挡在屏幕外）
    await expect(element(by.id('statsMedian'))).toExist();
    await expect(element(by.id('statsCV'))).toExist();

    await device.takeScreenshot(`text-${testType}-benchmark`);
  } catch (error) {
    // 确保即使出错也重新启用同步
    await device.enableSynchronization();
    throw error;
  }
}

describe('Text Component Test Page', () => {
  beforeAll(async () => {
    // 从首页点击 text 组件入口，触发 navigateTo 跳转
    await element(by.id('component-text')).tap();
    await waitFor(element(by.id('textPage'))).toBeVisible().withTimeout(3000);
  });

  it('renders text page correctly', async () => {
    await expect(element(by.id('textTitle'))).toHaveText('Text 组件能力测试');
  });

  it('shows all test type options', async () => {
    await expect(element(by.id('testType-basic'))).toBeVisible();
    await expect(element(by.id('testType-simple-text'))).toBeVisible();
    await expect(element(by.id('testType-font-size'))).toBeVisible();
    await expect(element(by.id('testType-var'))).toBeVisible();
    await expect(element(by.id('testType-calc'))).toBeVisible();
    await expect(element(by.id('testType-bindtap'))).toBeVisible();
    await expect(element(by.id('testType-line-height'))).toBeVisible();
    await expect(element(by.id('testType-mixed'))).toBeVisible();
  });

  it('shows benchmark button', async () => {
    await expect(element(by.id('runBenchmarkBtn'))).toBeVisible();
  });

  // ========== 基准测试（推荐用于性能测量）==========

  it('benchmark: basic with 100 texts', async () => {
    await element(by.id('count-100')).tap();
    await runBenchmarkTest('basic', 'Basic', '100');
  });

  it('benchmark: simple-text with 100 texts', async () => {
    await element(by.id('testType-simple-text')).tap();
    await runBenchmarkTest('simple-text', 'Simple', '100');
  });

  it('benchmark: font-size with 100 texts', async () => {
    await element(by.id('testType-font-size')).tap();
    await runBenchmarkTest('font-size', 'Font Size', '100');
  });

  it('benchmark: var (CSS variables) with 100 texts', async () => {
    await element(by.id('testType-var')).tap();
    await runBenchmarkTest('var', 'Var', '100');
  });

  it('benchmark: calc with 100 texts', async () => {
    await element(by.id('testType-calc')).tap();
    await runBenchmarkTest('calc', 'Calc', '100');
  });

  it('benchmark: bindtap with 100 texts', async () => {
    await element(by.id('testType-bindtap')).tap();
    await runBenchmarkTest('bindtap', 'Bindtap', '100');
  });

  it('benchmark: line-height with 100 texts', async () => {
    await element(by.id('testType-line-height')).tap();
    await runBenchmarkTest('line-height', 'Line Height', '100');
  });

  it('benchmark: mixed with 100 texts', async () => {
    await element(by.id('testType-mixed')).tap();
    await runBenchmarkTest('mixed', '综合', '100');
  });

  afterAll(async () => {
    // 点击页面内返回按钮，回到首页
    await element(by.id('backBtn')).tap();
    await waitFor(element(by.id('indexPage'))).toBeVisible().withTimeout(3000);
  });
});
