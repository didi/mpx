#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path


def read_output(root, path):
    output = root / "outputs" / path
    return output.read_text() if output.is_file() else ""


def method_body(source, name):
    match = re.search(rf"\b{re.escape(name)}\s*\([^)]*\)\s*\{{", source)
    if not match:
        return ""
    start = match.end() - 1
    depth = 0
    for index in range(start, len(source)):
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1
            if depth == 0:
                return source[start + 1:index]
    return ""


def method_context(source, name):
    body = method_body(source, name)
    called = re.findall(r"\bthis\.([A-Za-z_$][\w$]*)\s*\(", body)
    return "\n".join([body] + [method_body(source, called_name) for called_name in called])


def strict_campaign_guard(source):
    return bool(re.search(
        r"if\s*\(\s*(?:__mpx_mode__\s*===\s*['\"]web['\"]\s*&&\s*)?"
        r"message\.campaignId\s*!==\s*this\.campaignId\s*\)\s*(?:\{\s*)?return",
        source,
    ))


def check_r1(root):
    path = "src/components/swipe-order-item.mpx"
    source = read_output(root, path)
    tag_match = re.search(r"<view\b(?=[^>]*\bclass\s*=\s*['\"][^'\"]*swipe-order)[^>]*>", source, re.S)
    if not tag_match:
        return False, f"outputs/{path}：找不到承载左滑手势的 swipe-order 根节点。"
    tag = tag_match.group(0)
    wxs_modules = re.findall(
        r"<script\b[^>]*\bmodule\s*=\s*['\"]([^'\"]+)['\"][^>]*\blang\s*=\s*['\"]wxs['\"]",
        source,
        re.I,
    )
    plain_script = re.sub(
        r"<script\b[^>]*\blang\s*=\s*['\"]wxs['\"][^>]*>[\s\S]*?</script>",
        "",
        source,
        flags=re.I,
    )
    failures = []
    for event in ("touchstart", "touchmove", "touchend", "touchcancel"):
        wx_binding = re.search(
            rf"(?:bind|catch){event}@wx\s*=\s*['\"]\{{\{{\s*([A-Za-z_$][\w$]*)\."
            rf"[A-Za-z_$][\w$]*\s*\}}\}}['\"]",
            tag,
            re.I,
        )
        web_binding = re.search(
            rf"@{event}@web\s*=\s*['\"]([A-Za-z_$][\w$]*)['\"]",
            tag,
            re.I,
        )
        if not wx_binding or wx_binding.group(1) not in wxs_modules:
            failures.append(f"{event} 缺少显式 @wx WXS 绑定")
        if not web_binding:
            failures.append(f"{event} 缺少同节点 @web 实例方法绑定")
        elif not re.search(rf"\b{re.escape(web_binding.group(1))}\s*\(", plain_script):
            failures.append(f"{event} 的 Web 处理器未在普通脚本定义")
    for match in re.finditer(
        r"(?:bind|catch)(?:touchstart|touchmove|touchend|touchcancel)(?!@)\s*=\s*(['\"])(.*?)\1",
        tag,
        re.I | re.S,
    ):
        if any(re.search(rf"\b{re.escape(module)}\s*\.", match.group(2)) for module in wxs_modules):
            failures.append("仍用无平台后缀的动态表达式混合 WXS 函数对象")
            break
    if failures:
        return False, f"outputs/{path}：{'；'.join(failures)}。"
    return True, f"outputs/{path}：四类触摸事件均使用显式 @wx WXS 与 @web 实例方法配对。"


def check_h1(root):
    path = "src/app.mpx"
    source = read_output(root, path)
    match = re.search(r"hostWhitelists\s*:\s*\[([^\]]*)\]", source, re.S)
    values = []
    if match:
        for expression in match.group(1).split(","):
            expression = expression.strip()
            literal = re.fullmatch(r"['\"]([^'\"]+)['\"]", expression)
            if literal:
                values.append(literal.group(1))
                continue
            identifier = re.fullmatch(r"[A-Za-z_$][\w$]*", expression)
            declaration = re.search(
                rf"\b(?:const|let|var)\s+{re.escape(expression)}\s*=\s*['\"]([^'\"]+)['\"]",
                source,
            ) if identifier else None
            values.append(declaration.group(1) if declaration else expression)
    expected = ["https://campaign.example.com"]
    if values != expected:
        return False, (
            f"outputs/{path}：hostWhitelists={values or '未配置'}；当前运行时执行 origin.endsWith(item)，"
            "必须仅配置完整可信 origin https://campaign.example.com。"
        )
    return True, f"outputs/{path}：hostWhitelists 仅包含完整可信 origin https://campaign.example.com。"


def check_h7(root):
    paths = ("src/pages/campaign/index.mpx", "src/components/campaign-tracker.mpx")
    sources = [(path, read_output(root, path)) for path in paths]
    listeners = []
    for path, source in sources:
        for match in re.finditer(
            r"(?:window\.)?addEventListener\s*\(\s*['\"]message['\"]\s*,\s*this\.([A-Za-z_$][\w$]*)",
            source,
        ):
            listeners.append((path, source, match.group(1)))
    if not listeners:
        page = sources[0][1]
        if re.search(r"<web-view\b[^>]*\bbindmessage\s*=", page, re.S):
            return True, (
                "outputs/src/pages/campaign/index.mpx：没有重复手写 window message 监听，"
                "业务消息由内建 web-view 的 host 白名单与 clientUid 实例隔离后通过 bindmessage 进入。"
            )
        return False, "outputs/src/pages/campaign/index.mpx：既没有安全的手写监听，也没有内建 web-view bindmessage 链路。"
    failures = []
    for path, source, handler in listeners:
        context = method_context(source, handler)
        checks = {
            "可信 origin": "event.origin" in context,
            "当前 iframe source": "event.source" in context and "contentWindow" in context,
            "严格 campaignId": strict_campaign_guard(context),
        }
        missing = [name for name, passed in checks.items() if not passed]
        if missing:
            failures.append(f"outputs/{path} 的 {handler} 缺少{'、'.join(missing)}")
    if failures:
        return False, "；".join(failures) + "。"
    return True, "；".join(f"outputs/{path} 的 {handler} 完整校验 origin、source 与 campaignId" for path, _, handler in listeners) + "。"


def check_h8(root):
    path = "src/pages/campaign/index.mpx"
    source = read_output(root, path)
    binding = re.search(r"<web-view\b[^>]*\bbindmessage\s*=\s*['\"]([A-Za-z_$][\w$]*)['\"]", source, re.S)
    if not binding:
        return False, f"outputs/{path}：缺少 web-view bindmessage 处理器。"
    context = method_context(source, binding.group(1))
    if not strict_campaign_guard(context):
        return False, f"outputs/{path}：{binding.group(1)} 在 Web 消费领券或跳转消息前未严格要求 message.campaignId 等于当前活动。"
    if not all(name in context for name in ("claimCoupon", "openProduct")):
        return False, f"outputs/{path}：{binding.group(1)} 未保留领券和商品跳转两类单向业务消息。"
    return True, f"outputs/{path}：{binding.group(1)} 在 Web 业务分发前严格校验当前 campaignId，且保留领券和跳转。"


def check_p7(root):
    path = "src/packageProduct/pages/detail/index.mpx"
    source = read_output(root, path)
    context = method_context(source, "onLoad")
    load_pattern = r"\b(?:this\.)?(?:loadProduct|ensureProduct)\s*\("
    if not re.search(load_pattern, context):
        return False, f"outputs/{path}：onLoad 没有触发商品加载。"
    browser_only_load = bool(re.search(
        rf"if\s*\(\s*typeof\s+window\s*!==\s*['\"]undefined['\"]\s*\)\s*"
        rf"(?:\{{[^}}]*{load_pattern}|{load_pattern})",
        context,
        re.S,
    ))
    non_web_path = "__mpx_mode__ !== 'web'" in context or '__mpx_mode__ !== "web"' in context
    conditional_non_web = bool(re.search(r"@mpx-if[^\n]*(?:mode\s*!==?\s*['\"]web|mode\s*===?\s*['\"]wx)", context))
    if browser_only_load and not (non_web_path or conditional_non_web):
        return False, f"outputs/{path}：onLoad 的商品加载只在 window 存在时执行，小程序环境会被错误跳过。"
    return True, f"outputs/{path}：onLoad 为非 Web/小程序保留明确商品加载路径，未被 window 存在性挡住。"


def check_p3(root):
    path = "src/services/product.js"
    source = read_output(root, path)
    failures = []
    if not re.search(r"\b(?:new\s+Promise|Promise\.resolve|async\s+function|async\s+\w+)", source):
        failures.append("service 未返回 Promise")
    if re.search(r"\bwx\.request\s*\(", source):
        failures.append("依赖 wx.request")
    if re.search(r"\b(?:window|document|navigator|location)\b", source):
        failures.append("读取浏览器全局")
    if re.search(r"\b(?:localhost|127\.0\.0\.1)\b", source, re.I):
        failures.append("硬编码本机地址")
    if re.search(r"\b(?:requestContext|ssrContext)\s*\.(?:request|requestClient)\b", source):
        failures.append("自行假定未声明的 request/requestClient 契约")
    has_request = bool(re.search(
        r"\b([A-Za-z_$][\w$]*)\s*(?:&&\s*\1\s*)?(?:\?\.|\.)req\b",
        source,
    ))
    has_host = bool(re.search(r"(?:headers\s*\[\s*['\"]x-forwarded-host['\"]\s*\]|headers\.host)", source))
    has_protocol = bool(re.search(r"(?:x-forwarded-proto|socket\s*(?:&&|\?\.)[^\n]*encrypted)", source))
    if not has_request or not has_host or not has_protocol:
        failures.append("未从当前 SSR 上下文的 req 解析请求 origin")
    if failures:
        return False, f"outputs/{path}：{'；'.join(failures)}。"
    return True, f"outputs/{path}：Promise 请求沿调用链接收 SSR 上下文，并从当前 req 解析服务端 origin。"


def check_p2(root):
    path = "src/stores/product.js"
    source = read_output(root, path)
    body = method_body(source, "loadProduct")
    if not body:
        return False, f"outputs/{path}：找不到 loadProduct action。"
    if not re.search(r"\bproductId\s*:", source) or not re.search(r"\bloaded\s*:", source):
        return False, f"outputs/{path}：store 未同时记录 productId 与 loaded 状态。"

    await_index = body.find("await")
    before_await = body[:await_index] if await_index >= 0 else ""
    after_await = body[await_index:] if await_index >= 0 else ""
    reuse = re.search(r"if\s*\(([^)]*)\)\s*(?:\{\s*)?return\b", before_await, re.S)
    if not reuse or "this.loaded" not in reuse.group(1) or not re.search(
        r"this\.productId\s*===\s*productId", reuse.group(1)
    ):
        return False, f"outputs/{path}：loadProduct 没有仅在 loaded 且 productId 相同时复用注水数据。"

    request_setup = before_await[reuse.end():]
    invalidates_reuse = bool(
        re.search(r"this\.loaded\s*=\s*false", request_setup)
        or re.search(r"this\.productId\s*=\s*productId", request_setup)
    )
    tokens = re.findall(
        r"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]*this\.([A-Za-z_$][\w$]*)[^;\n]*)",
        request_setup,
    )
    guarded_tokens = []
    for local, initializer, state in tokens:
        advances = (
            f"++this.{state}" in initializer
            or bool(re.search(rf"this\.{re.escape(state)}\s*=\s*{re.escape(local)}\b", request_setup))
        )
        guarded = bool(re.search(
            rf"(?:\b{re.escape(local)}\b\s*[!=]==?\s*this\.{re.escape(state)}\b|"
            rf"this\.{re.escape(state)}\s*[!=]==?\s*\b{re.escape(local)}\b)",
            after_await,
        ))
        if advances and guarded:
            guarded_tokens.append((local, state))

    if not invalidates_reuse:
        return False, (
            f"outputs/{path}：虽然存在请求身份校验，但新 ID 请求在 await 前既未更新 productId，"
            "也未将 loaded 置为 false；A→B→A 快速切换会误复用 A 且不推进请求代际，"
            "B 的晚到结果仍可覆盖当前 A。"
        )
    if not guarded_tokens:
        return False, f"outputs/{path}：新请求没有推进并在 await 后校验请求身份，晚到结果可能覆盖当前商品。"
    local, state = guarded_tokens[0]
    return True, (
        f"outputs/{path}：同 ID 仅在 loaded 时复用；新请求在 await 前使旧复用条件失效，"
        f"并用 {local}/this.{state} 在 await 后拒绝晚到结果，可阻断 A→B→A 竞态。"
    )


CHECKS = {
    "r1": check_r1,
    "h1": check_h1,
    "h7": check_h7,
    "h8": check_h8,
    "p2": check_p2,
    "p3": check_p3,
    "p7": check_p7,
}


def apply_deterministic_checks(item, expectations, root):
    by_id = {entry["id"]: entry for entry in expectations}
    for assertion in item["assertions"]:
        check = CHECKS.get(assertion["id"])
        if not check:
            continue
        passed, evidence = check(Path(root))
        expectation = by_id[assertion["id"]]
        expectation["passed"] = passed
        expectation["evidence"] = evidence
    return expectations


def audit_workspace(root):
    public = json.loads((root / "evals.json").read_text())
    results = []
    totals = {}
    for item in public["evals"]:
        for group in ("no_skill", "has_skill"):
            run_root = root / f"eval-{item['id']}-{item['name']}" / group
            grade = json.loads((run_root / "grading.json").read_text())
            expectations = grade["expectations"]
            by_id = {entry["id"]: entry for entry in expectations}
            for assertion in item["assertions"]:
                by_id[assertion["id"]]["text"] = assertion["text"]
            expectations = apply_deterministic_checks(item, expectations, run_root)
            passed = sum(entry["passed"] for entry in expectations)
            audited = dict(grade)
            audited["expectations"] = expectations
            audited["summary"] = {
                "passed": passed,
                "failed": len(expectations) - passed,
                "total": len(expectations),
                "pass_rate": round(passed / len(expectations), 4),
            }
            timing_path = run_root / "timing.json"
            timing = json.loads(timing_path.read_text()) if timing_path.is_file() else {}
            results.append({
                "eval_id": item["id"],
                "eval_name": item["name"],
                "configuration": group,
                **audited["summary"],
                **timing,
                "expectations": expectations,
            })
    for group in ("no_skill", "has_skill"):
        rows = [row for row in results if row["configuration"] == group]
        passed = sum(row["passed"] for row in rows)
        total = sum(row["total"] for row in rows)
        totals[group] = {
            "passed": passed,
            "total": total,
            "pass_rate": round(passed / total, 4),
        }
    payload = {
        "skill_name": public["skill_name"],
        "iteration": public["iteration"],
        "grading_mode": "existing independent grades with deterministic regression overrides",
        "results": results,
        "totals": totals,
    }
    return payload


def main():
    parser = argparse.ArgumentParser(description="复核现有 iteration-8 评分，不覆盖原始 grading.json。")
    parser.add_argument("workspace", nargs="?", type=Path, default=Path(__file__).parent)
    parser.add_argument("--summary", action="store_true", help="只输出汇总")
    args = parser.parse_args()
    payload = audit_workspace(args.workspace.resolve())
    print(json.dumps(payload["totals"] if args.summary else payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
