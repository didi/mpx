import { consoleReporter } from './reporters/console';
// 默认 reporter 是 consoleReporter——业务侧不调 setReporter 也能在 console 看到聚合表。
let _reporter = consoleReporter;
// 录制状态机：未 start 时所有 pushMeasure 立即丢弃。
let _recording = false;
// 实时聚合容器：push 阶段直接累加，end 时回填 avg。
// 不保留原始事件——窗口期间零事件对象分配是本设计的核心。
// 每次 start 重建新 Map 而非 clear：end 交给 reporter 的引用就是该窗口的私有数据，
// 业务侧异步消费也不会被下一次窗口覆盖。窗口级别一次 Map 分配可忽略。
let aggMap = new Map();
function runReporter(reporter, agg) {
    try {
        reporter(agg);
    }
    catch (e) {
        // 故意吞掉 reporter 错误，不影响业务；reporter 自己应对异常负责。
    }
}
export const bus = {
    setReporter(r) {
        _reporter = r;
    },
    start() {
        // 重复 start 视为幂等：沿用已有窗口，不清空已采集的数据；
        // 想强制重开新窗口，先 end 再 start。
        if (_recording)
            return;
        _recording = true;
        aggMap = new Map();
    },
    end(reporter) {
        // 未 start 直接 end 是 noop，不报错也不调 reporter。
        if (!_recording)
            return;
        _recording = false;
        if (aggMap.size === 0)
            return;
        // 最后一次性回填 avg，避免 push 阶段反复算除法。
        for (const s of aggMap.values()) {
            s.avg = s.count ? s.sum / s.count : 0;
        }
        // 全局 reporter 先于局部 reporter，但共享同一份 Map 实例——
        // reporter 不应修改它（如需保留请自行 clone）。
        if (_reporter)
            runReporter(_reporter, aggMap);
        if (reporter)
            runReporter(reporter, aggMap);
    },
    isRecording() {
        return _recording;
    },
    pushMeasure(name, dur) {
        if (!_recording)
            return;
        let s = aggMap.get(name);
        if (!s) {
            s = { count: 0, sum: 0, avg: 0, max: 0 };
            aggMap.set(name, s);
        }
        s.count++;
        s.sum += dur;
        if (dur > s.max)
            s.max = dur;
    }
};
