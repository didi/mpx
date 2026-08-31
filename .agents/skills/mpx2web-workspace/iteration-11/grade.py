#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path


def read_output(root, path):
    output = root / "outputs" / path
    return output.read_text() if output.is_file() else ""


def method_body(source, name):
    patterns = (
        rf"\b{re.escape(name)}\s*\([^)]*\)\s*\{{",
        rf"\b(?:[A-Za-z_$][\w$]*\.)?{re.escape(name)}\s*=\s*"
        rf"(?:async\s+)?function\s*\([^)]*\)\s*\{{",
        rf"\b{re.escape(name)}\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*\{{",
        rf"\b(?:[A-Za-z_$][\w$]*\.)?{re.escape(name)}\s*=\s*"
        rf"(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{{",
    )
    matches = [match for pattern in patterns if (match := re.search(pattern, source))]
    if not matches:
        return ""
    match = min(matches, key=lambda item: item.start())
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


def function_names(source):
    names = re.findall(r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\(", source)
    names.extend(re.findall(
        r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*"
        r"(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{",
        source,
    ))
    return list(dict.fromkeys(names))


def function_body(source, name):
    patterns = (
        rf"\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{",
        rf"\b(?:const|let|var)\s+{re.escape(name)}\s*=\s*"
        rf"(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{{",
    )
    matches = [match for pattern in patterns if (match := re.search(pattern, source))]
    if not matches:
        return ""
    match = min(matches, key=lambda item: item.start())
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


def method_names(source):
    reserved = {"if", "for", "while", "switch", "catch", "function"}
    names = []
    for match in re.finditer(
        r"(?m)^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)\n]*\)\s*\{",
        source,
    ):
        name = match.group(1)
        if name not in reserved and name not in names:
            names.append(name)
    return names


def recursive_method_context(source, name, max_depth=3):
    visited = set()
    bodies = []

    def visit(current, depth):
        if current in visited or depth > max_depth:
            return
        visited.add(current)
        body = method_body(source, current)
        if not body:
            return
        bodies.append(body)
        for called in re.findall(r"\bthis\.([A-Za-z_$][\w$]*)\s*\(", body):
            visit(called, depth + 1)

    visit(name, 0)
    return "\n".join(bodies)


def recursive_callable_context(source, name, max_depth=4):
    callable_names = set(method_names(source)) | set(function_names(source))
    visited = set()
    bodies = []

    def visit(current, depth):
        if current in visited or depth > max_depth:
            return
        visited.add(current)
        body = method_body(source, current) or function_body(source, current)
        if not body:
            return
        bodies.append(body)
        for called in re.findall(r"\b(?:this\.)?([A-Za-z_$][\w$]*)\s*\(", body):
            if called in callable_names:
                visit(called, depth + 1)

    visit(name, 0)
    return "\n".join(bodies)


def task_identity_guard(source, task):
    current = r"this\.(?:_?socketTask)"
    escaped = re.escape(task)
    mismatch = rf"(?:{current}\s*!==\s*{escaped}|{escaped}\s*!==\s*{current})"
    helper = rf"this\.[A-Za-z_$][\w$]*\s*\(\s*{escaped}\b[^)]*\)"
    for match in re.finditer(r"\bif\s*\(", source):
        open_index = source.find("(", match.start())
        condition, end = parenthesized(source, open_index)
        if not condition or not re.match(r"\s*(?:\{\s*)?return\b", source[end:]):
            continue
        if re.search(mismatch, condition) or re.search(rf"!\s*{helper}", condition):
            return True
    return bool(re.search(
        rf"(?:{current}\s*===\s*{escaped}|{escaped}\s*===\s*{current}|{helper})",
        source,
    ))


def find_method(source, predicate):
    for name in method_names(source):
        body = method_body(source, name)
        if body and predicate(body):
            return name, body
    return "", ""


def sdk_initializer(source, module_name):
    escaped = re.escape(module_name)
    dynamic = find_method(
        source,
        lambda body: bool(re.search(rf"\bimport\s*\(\s*['\"]{escaped}['\"]\s*\)", body)),
    )
    if dynamic[0]:
        return dynamic
    return find_method(
        source,
        lambda body: len(re.findall(r"\bawait\b", body)) >= 1
        and bool(re.search(r"\b[A-Za-z_$][\w$]*\.create\s*\(", body))
        and "tracker" in body.lower(),
    )


def invalidates_before_close(source, name):
    """Follow dedicated cleanup helpers without losing statement order."""
    candidates = [method_body(source, name)]
    direct = candidates[0]
    for called in re.findall(r"\bthis\.([A-Za-z_$][\w$]*)\s*\(", direct):
        candidates.append(method_body(source, called))
    for body in candidates:
        close = re.search(r"\b[A-Za-z_$][\w$]*\.close\s*\(", body)
        invalidate = re.search(
            r"this\.(?:_?(?:socketTask|socket|channelSocket))\s*=\s*null|"
            r"(?:\+\+\s*this\.|this\.)[A-Za-z_$][\w$]*(?:Version|Generation|Id)\b",
            body,
            re.I,
        )
        if close and invalidate and invalidate.start() < close.start():
            return True
    return False


def strict_state_comparison(source, terms):
    operand = r"(?:this\.)?[A-Za-z_$][\w$]*"
    for match in re.finditer(rf"({operand})\s*(?:===|!==)\s*({operand})", source):
        left, right = match.groups()
        if not (left.startswith("this.") or right.startswith("this.")):
            continue
        left_name = left.rsplit(".", 1)[-1].lower().replace("_", "")
        right_name = right.rsplit(".", 1)[-1].lower().replace("_", "")
        if any(term in left_name and term in right_name for term in terms):
            return True
    return False


def has_liveness_state(source):
    return bool(re.search(
        r"\bthis\.[A-Za-z_$][\w$]*(?:mounted|attached|ready|active|alive|detached|destroyed|disposed|visible)\b",
        source,
        re.I,
    ))


def has_generation_guard(source):
    return strict_state_comparison(
        source,
        ("version", "generation", "initid", "token", "sequence", "epoch"),
    )


def has_generation_advance(source):
    state = r"[A-Za-z_$][\w$]*(?:version|generation|initid|token|sequence|epoch)[\w$]*"
    if re.search(
        rf"(?:\+\+\s*this\.{state}|this\.{state}\s*(?:\+\+|\+=\s*1))",
        source,
        re.I,
    ) or re.search(
        rf"this\.(?P<state>{state})\s*=\s*this\.(?P=state)\s*\+\s*1\b",
        source,
        re.I,
    ):
        return True
    if re.search(
        rf"this\.(?P<state>{state})\s*=\s*\(\s*this\.(?P=state)\s*\|\|\s*0\s*\)\s*\+\s*1\b",
        source,
        re.I,
    ):
        return True
    for match in re.finditer(
        rf"\b(?:const|let)\s+(?P<local>[A-Za-z_$][\w$]*)\s*=\s*"
        rf"this\.(?P<state>{state})\s*\+\s*1\b",
        source,
        re.I,
    ):
        if re.search(
            rf"\bthis\.{re.escape(match.group('state'))}\s*=\s*"
            rf"{re.escape(match.group('local'))}\b",
            source[match.end():],
            re.I,
        ):
            return True
    for match in re.finditer(
        rf"\b(?:const|let)\s+(?P<local>[A-Za-z_$][\w$]*)\s*=\s*"
        rf"\(\s*this\.(?P<state>{state})\s*\|\|\s*0\s*\)\s*\+\s*1\b",
        source,
        re.I,
    ):
        if re.search(
            rf"\bthis\.{re.escape(match.group('state'))}\s*=\s*"
            rf"{re.escape(match.group('local'))}\b",
            source[match.end():],
            re.I,
        ):
            return True
    return False


def has_liveness_invalidation(source):
    return bool(re.search(
        r"\bthis\.[A-Za-z_$][\w$]*(?:mounted|attached|ready|active|alive|visible)\s*=\s*false\b|"
        r"\bthis\.[A-Za-z_$][\w$]*(?:detached|destroyed|disposed)\s*=\s*true\b",
        source,
        re.I,
    ))


def current_guard(source, identity=None):
    if not has_liveness_state(source) or not has_generation_guard(source):
        return False
    return identity is None or strict_state_comparison(source, (identity.lower(),))


def parenthesized(source, open_index):
    depth = 0
    quote = ""
    escaped = False
    for index in range(open_index, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = ""
            continue
        if char in ("'", '"', chr(96)):
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return source[open_index + 1:index], index + 1
    return "", open_index


def braced(source, open_index):
    depth = 0
    quote = ""
    escaped = False
    for index in range(open_index, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = ""
            continue
        if char in ("'", '"', chr(96)):
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[open_index + 1:index], index + 1
    return "", open_index


def web_guarded_call(body, method_name):
    calls = list(re.finditer(rf"\bthis\.{re.escape(method_name)}\s*\(", body))
    for call in calls:
        guarded = False
        for match in re.finditer(r"\bif\s*\(", body[:call.start()]):
            open_index = body.find("(", match.start())
            condition, condition_end = parenthesized(body, open_index)
            if not condition:
                continue
            positive = bool(re.search(
                r"(?:__mpx_mode__\s*={2,3}\s*['\"]web['\"]|"
                r"['\"]web['\"]\s*={2,3}\s*__mpx_mode__)",
                condition,
            ))
            negative = bool(re.search(
                r"(?:__mpx_mode__\s*!={1,2}\s*['\"]web['\"]|"
                r"['\"]web['\"]\s*!={1,2}\s*__mpx_mode__)",
                condition,
            ))
            cursor = condition_end
            while cursor < len(body) and body[cursor].isspace():
                cursor += 1
            if positive and cursor < len(body) and body[cursor] == "{":
                _, block_end = braced(body, cursor)
                guarded = cursor < call.start() < block_end
            elif positive and not body[cursor:call.start()].strip():
                guarded = True
            elif negative and re.search(r"\breturn\b", body[condition_end:call.start()]):
                guarded = True
            if guarded:
                break
        if not guarded:
            return False
    return bool(calls)


def guard_positions(source, body, predicate):
    positions = []
    for match in re.finditer(r"\bthis\.([A-Za-z_$][\w$]*)\s*\(", body):
        candidate = method_body(source, match.group(1))
        if candidate and predicate(candidate):
            positions.append(match.start())
    for match in re.finditer(r"\bif\s*\(", body):
        open_index = body.find("(", match.start())
        condition, end = parenthesized(body, open_index)
        if condition and re.search(r"\breturn\b", body[end:end + 320]) and predicate(condition):
            positions.append(match.start())
    return sorted(set(positions))


def every_await_is_guarded(body, positions, minimum=2):
    awaits = list(re.finditer(r"\bawait\b", body))
    if len(awaits) < minimum:
        return False
    for index, await_match in enumerate(awaits):
        boundary_end = awaits[index + 1].start() if index + 1 < len(awaits) else len(body)
        if not any(await_match.end() < position < boundary_end for position in positions):
            return False
    return True


def strict_campaign_guard(source):
    message_ids = {"message.campaignId"}
    for declaration in re.finditer(
        r"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)",
        source,
    ):
        expression = declaration.group(2)
        if "message" in expression and "campaignId" in expression:
            message_ids.add(declaration.group(1))
    target = r"(?:(?:this|[A-Za-z_$][\w$]*)\.)?campaignId"
    for match in re.finditer(r"\bif\s*\(", source):
        open_index = source.find("(", match.start())
        condition, end = parenthesized(source, open_index)
        if not condition or not re.search(r"\breturn\b", source[end:end + 320]):
            continue
        for message_id in message_ids:
            candidate = re.escape(message_id)
            comparison = bool(
                re.search(rf"{candidate}\s*!==\s*{target}", condition)
                or re.search(rf"{target}\s*!==\s*{candidate}", condition)
            )
            optional = bool(re.search(rf"{candidate}\s*&&", condition))
            if comparison and not optional:
                return True
    return False


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


def check_w0(root):
    path = "src/components/product-card.mpx"
    source = read_output(root, path)
    if not re.search(r"<style\b[^>]*\bscoped\b[^>]*>", source, re.I):
        return False, f"outputs/{path}：商品卡没有可从候选文件直接验证的 Web scoped 样式隔离。"
    return True, f"outputs/{path}：商品卡通过 scoped 建立组件级 Web 样式隔离。"


def check_a5(root):
    path = "src/pages/community/publish.mpx"
    source = read_output(root, path)
    methods = ("choosePlace", "openPlace", "choosePhoto")
    contexts = {name: recursive_callable_context(source, name) for name in methods}
    missing = [name for name, body in contexts.items() if not body]
    if missing:
        return False, f"outputs/{path}：找不到待隔离的业务方法：{', '.join(missing)}。"
    forbidden = re.compile(
        r"\b(?:globalThis|window|document|navigator)\s*(?:\.|\[)|"
        r"\b[A-Za-z_$][\w$]*(?:Bridge|SDK)\s*\.",
        re.I,
    )
    offenders = [name for name, body in contexts.items() if forbidden.search(body)]
    if offenders:
        return False, (
            f"outputs/{path}：{', '.join(offenders)} 在未声明协议的能力分支中访问了浏览器全局对象"
            "或自行假定 Bridge/SDK 接口。"
        )
    return True, f"outputs/{path}：三项缺失能力的方法均未自行发明浏览器、Bridge 或 SDK 协议。"


def check_s1(root):
    path = "src/pages/member/invite.mpx"
    source = read_output(root, path)
    failures = []
    for lifecycle in ("onShareAppMessage", "onShareTimeline"):
        if not method_body(source, lifecycle):
            failures.append(f"小程序缺少 {lifecycle}")
        removal = re.search(
            rf"implement\s*\(\s*['\"]{lifecycle}['\"][\s\S]{{0,320}}?remove\s*:\s*true",
            source,
        )
        wx_only = re.search(
            rf"@mpx-if[^\n]*(?:__mpx_mode__\s*===\s*['\"]wx['\"]|mode\s*===?\s*['\"]wx['\"])[\s\S]*?\b{lifecycle}\s*\(",
            source,
        )
        if not removal and not wx_only:
            failures.append(f"Web 未移除 {lifecycle}")
    if failures:
        return False, f"outputs/{path}：{'；'.join(failures)}。"
    return True, f"outputs/{path}：分享生命周期保留给小程序，并从 Web 构造选项中移除。"


def check_r4(root):
    path = "src/components/logistics-channel.mpx"
    source = read_output(root, path)
    has_task = bool(re.search(
        r"\b(?:const|let)\s+[A-Za-z_$][\w$]*\s*=\s*(?:mpx|wx)\.connectSocket\s*\(",
        source,
    ))
    global_socket_api = re.search(r"\b(?:mpx|wx)\.(?:on|off|send|close)Socket\w*\s*\(", source)
    native_socket = re.search(r"\bnew\s+(?:window\.)?WebSocket\s*\(", source)
    if not has_task or global_socket_api or native_socket:
        return False, f"outputs/{path}：没有统一使用 connectSocket 返回的 SocketTask，或仍混用了全局/原生 WebSocket API。"
    return True, f"outputs/{path}：连接由 connectSocket 返回的局部 SocketTask 承载，未混用全局 Socket API。"


def check_r5(root):
    path = "src/components/logistics-channel.mpx"
    source = read_output(root, path)
    body = method_body(source, "connectChannel")
    failures = []
    task_match = re.search(
        r"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:mpx|wx)\.connectSocket\s*\(",
        body,
    )
    task = task_match.group(1) if task_match else "task"
    callbacks = ("onOpen", "onMessage", "onError", "onClose")
    starts = []
    for callback in callbacks:
        match = re.search(rf"\b{re.escape(task)}\.{callback}\s*\(", body)
        if not match:
            failures.append(f"缺少 {callback}")
        else:
            starts.append((match.start(), callback))
    starts.sort()
    for index, (start, callback) in enumerate(starts):
        end = starts[index + 1][0] if index + 1 < len(starts) else len(body)
        segment = body[start:end]
        guarded = task_identity_guard(segment, task)
        if not guarded:
            failures.append(f"{callback} 未校验当前任务")
    if failures:
        return False, f"outputs/{path}：{'；'.join(failures)}。"
    return True, f"outputs/{path}：open/message/error/close 四类回调均校验捕获任务仍为当前任务。"


def check_r6(root):
    path = "src/components/logistics-channel.mpx"
    source = read_output(root, path)
    failures = []
    for name in ("connectChannel", "detached"):
        if not invalidates_before_close(source, name):
            failures.append(f"{name} 未在 close 前废弃任务身份")
    if failures:
        return False, f"outputs/{path}：{'；'.join(failures)}。"
    return True, f"outputs/{path}：重连与卸载均先废弃任务身份，再关闭旧 SocketTask。"


def check_r7(root):
    path = "src/components/logistics-channel.mpx"
    source = read_output(root, path)
    context = method_context(source, "sendHeartbeat")
    local = re.search(
        r"\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*this\.(?:_?socketTask)\b",
        context,
    )
    if not local:
        return False, f"outputs/{path}：sendHeartbeat 未捕获当前 SocketTask。"
    task = local.group(1)
    identity = task_identity_guard(context, task)
    ready = re.search(
        rf"{re.escape(task)}\.readyState\s*(?:===|!==)\s*{re.escape(task)}\.OPEN",
        context,
    )
    send = re.search(rf"\b{re.escape(task)}\.send\s*\(", context)
    if not identity or not ready or not send or ready.start() > send.start():
        return False, f"outputs/{path}：发送前没有同时证明任务身份有效且 readyState 为 task.OPEN。"
    return True, f"outputs/{path}：sendHeartbeat 在 task.send 前校验当前任务身份和 task.readyState/task.OPEN。"


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


def check_h2(root):
    path = "vue.config.js"
    source = read_output(root, path)
    public_path = re.search(r"\bpublicPath\s*:\s*['\"](/mall/)['\"]", source)
    route_base = re.search(r"\brouteConfig\s*:\s*\{[\s\S]*?\bbase\s*:\s*['\"](/mall/)['\"]", source)
    if not public_path or not route_base or public_path.group(1) != route_base.group(1):
        return False, f"outputs/{path}：publicPath 与 routeConfig.base 未同时、同值配置为 /mall/。"
    return True, f"outputs/{path}：publicPath 与 routeConfig.base 均为 /mall/。"


def check_h3(root):
    path = "src/components/campaign-tracker.mpx"
    source = read_output(root, path)
    static_import = re.search(
        r"^\s*import\s+[^\n]*['\"]@business/campaign-tracker-web['\"]",
        source,
        re.M,
    )
    init_name, context = find_method(
        source,
        lambda body: bool(re.search(
            r"\bimport\s*\(\s*['\"]@business/campaign-tracker-web['\"]\s*\)",
            body,
        )),
    )
    dynamic_import = re.search(r"\bimport\s*\(\s*['\"]@business/campaign-tracker-web['\"]\s*\)", context)
    callers = [
        body for name in method_names(source)
        if name != init_name
        for body in [method_body(source, name)]
        if re.search(rf"\bthis\.{re.escape(init_name)}\s*\(", body)
    ] if init_name else []
    web_guard = (
        "__mpx_mode__" in context and "web" in context
        or callers and all(web_guarded_call(body, init_name) for body in callers)
    )
    if static_import or not dynamic_import or not web_guard:
        return False, f"outputs/{path}：SDK 未被动态加载并限制在 Web 调用链，或仍存在模块顶层静态引入。"
    return True, f"outputs/{path}：SDK 在 {init_name} 中动态加载，方法自身或全部直接调用点受 Web 分支保护。"


def check_h4(root):
    path = "src/components/campaign-tracker.mpx"
    source = read_output(root, path)
    init_name, body = sdk_initializer(source, "@business/campaign-tracker-web")
    guards = guard_positions(source, body, current_guard)
    if not init_name or not has_generation_advance(body) or not every_await_is_guarded(body, guards):
        return False, f"outputs/{path}：动态 import/create 的异步边界后未逐次复核当前挂载身份。"
    return True, f"outputs/{path}：{init_name} 的每个 SDK 异步边界后都复核挂载状态与初始化代际。"


def check_h5(root):
    path = "src/components/campaign-tracker.mpx"
    source = read_output(root, path)
    init_name, body = sdk_initializer(source, "@business/campaign-tracker-web")
    switch_contexts = [recursive_method_context(source, "observer")]
    switch_contexts.extend(
        recursive_method_context(source, name)
        for name in method_names(source)
        if re.search(r"(?:refresh|restart|reload|campaign)", name, re.I)
    )
    switch_context = "\n".join(switch_contexts)
    campaign_guards = guard_positions(
        source,
        body,
        lambda candidate: current_guard(candidate, "campaignid"),
    )
    if (
        not init_name
        or f"this.{init_name}" not in switch_context
        or not has_generation_advance(body)
        or not campaign_guards
    ):
        return False, f"outputs/{path}：活动切换未同时推进初始化并校验代际与 campaignId。"
    return True, f"outputs/{path}：活动属性变化会触发 {init_name}，当前身份守卫同时校验代际与 campaignId。"


def check_h6(root):
    path = "src/components/campaign-tracker.mpx"
    source = read_output(root, path)
    detached = recursive_method_context(source, "detached")
    checks = (
        "removeEventListener" in detached,
        bool(re.search(r"\.destroy\s*\(", detached)),
    )
    if not all(checks):
        return False, f"outputs/{path}：卸载时没有同时移除监听并销毁 SDK create 返回的实例。"
    return True, f"outputs/{path}：detached 的清理链路移除监听并销毁 SDK 实例。"


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
    binding = re.search(
        r"<web-view\b[^>]*\bbindmessage\s*=\s*['\"]\s*"
        r"([A-Za-z_$][\w$]*)(?:\s*\([^'\"]*\))?\s*['\"]",
        source,
        re.S,
    )
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


def check_p0(root):
    path = "src/app.mpx"
    source = read_output(root, path)
    body = method_body(source, "onAppInit")
    if not body or not re.search(r"\breturn\b[\s\S]*?\bpinia\s*:\s*createPinia\s*\(", body):
        return False, f"outputs/{path}：onAppInit 没有为当前请求创建并返回新的 Pinia。"
    outside = source.replace(body, "", 1)
    if re.search(r"\b(?:const|let|var)\s+\w+\s*=\s*createPinia\s*\(", outside):
        return False, f"outputs/{path}：Pinia 仍在请求外创建，可能被 Node 并发请求共享。"
    return True, f"outputs/{path}：createPinia 位于 onAppInit 返回路径中，每次 SSR 初始化独立创建。"


def check_p1(root):
    page_path = "src/packageProduct/pages/detail/index.mpx"
    store_path = "src/stores/product.js"
    page = read_output(root, page_path)
    store = read_output(root, store_path)
    prefetch = method_body(page, "serverPrefetch")
    prefetch_context = recursive_method_context(page, "serverPrefetch", max_depth=4)
    page_load = recursive_method_context(page, "loadProduct", max_depth=3)
    store_load = method_body(store, "loadProduct")
    returns_promise = bool(
        re.search(r"\breturn\b", prefetch)
        and (
            "loadProduct" in prefetch_context
            or re.search(r"\breturn\s+this\.[A-Za-z_$][\w$]*(?:Promise|Task)\b", prefetch)
        )
    )
    waits_store = "await" in prefetch_context and "loadProduct" in prefetch_context
    waits_both = (
        "Promise.all" in store_load
        or (
            len(re.findall(r"\bawait\b", store_load)) >= 2
            and "recommend" in store_load.lower()
            and "product" in store_load.lower()
        )
    )
    if not returns_promise or not waits_store or not waits_both:
        return False, f"outputs/{page_path}、outputs/{store_path}：serverPrefetch 未可验证地等待商品与首屏推荐数据。"
    return True, f"outputs/{page_path} 返回商品加载 Promise，outputs/{store_path} 等待商品与推荐两路数据。"


def check_p4(root):
    path = "src/components/product-recommendations.mpx"
    source = read_output(root, path)
    static_import = re.search(
        r"^\s*import\s+[^\n]*['\"]@business/product-exposure-web['\"]",
        source,
        re.M,
    )
    init_name, body = find_method(
        source,
        lambda candidate: bool(re.search(
            r"\bimport\s*\(\s*['\"]@business/product-exposure-web['\"]\s*\)",
            candidate,
        )),
    )
    callers = [
        method_body(source, name)
        for name in method_names(source)
        if name != init_name and re.search(rf"\bthis\.{re.escape(init_name)}\s*\(", method_body(source, name))
    ] if init_name else []
    client_guard = (
        "__mpx_mode__" in body and "web" in body
        or bool(re.search(r"typeof\s+window\s*===\s*['\"]undefined['\"]", body))
        or callers and all(
            web_guarded_call(caller, init_name)
            or ("__mpx_mode__" in caller and "web" in caller)
            for caller in callers
        )
    )
    generation_advance = has_generation_advance(body) or any(
        has_generation_advance(caller) for caller in callers
    )
    guards = guard_positions(source, body, current_guard)
    if (
        static_import
        or not init_name
        or not client_guard
        or not generation_advance
        or not every_await_is_guarded(body, guards)
    ):
        return False, f"outputs/{path}：曝光 SDK 未被 Web 客户端动态隔离，或异步边界缺少旧商品/卸载校验。"
    return True, f"outputs/{path}：{init_name} 在 Web 客户端动态加载曝光 SDK，且各 await 后复核挂载与商品代际。"


def check_p5(root):
    path = "src/components/product-recommendations.mpx"
    source = read_output(root, path)
    init_name, body = sdk_initializer(source, "@business/product-exposure-web")
    detached = recursive_method_context(source, "detached")
    observer = body.find("IntersectionObserver")
    guards = guard_positions(source, body, current_guard)
    checks = (
        bool(init_name),
        has_liveness_invalidation(detached),
        has_generation_advance(detached),
        bool(re.search(r"\.disconnect\s*\(", detached)),
        bool(re.search(r"\.destroy\s*\(", detached)),
        observer >= 0 and any(position > observer for position in guards),
    )
    if not all(checks):
        return False, f"outputs/{path}：卸载/切换未同时废弃代际、断开 Observer 并销毁 tracker。"
    return True, f"outputs/{path}：卸载清理链路断开 Observer、销毁 tracker，回调守卫阻止旧代际上报。"


def check_p6(root):
    path = "vue.config.js"
    source = read_output(root, path)
    checks = (
        bool(re.search(r"\buseSSR\s*:\s*true", source)),
        bool(re.search(r"\bmode\s*:\s*['\"]history['\"]", source)),
        bool(re.search(r"\bpublicPath\s*:\s*['\"]/mall/['\"]", source)),
        bool(re.search(r"\bbase\s*:\s*['\"]/mall/['\"]", source)),
    )
    if not all(checks):
        return False, f"outputs/{path}：SSR、history、publicPath=/mall/ 与 route base=/mall/ 未全部配置。"
    return True, f"outputs/{path}：useSSR、history 与两处 /mall/ 部署基路径配置齐全。"


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
    first_async = re.search(r"\bawait\b|\bPromise\.all\s*\(|\bfetch(?:Product|Recommendations)\s*\(", body)
    if not first_async:
        return False, f"outputs/{path}：loadProduct 没有可验证的异步商品加载。"
    before_async = body[:first_async.start()]
    after_async = body[first_async.start():]
    reuse = re.search(
        r"if\s*\(([^)]*(?:productId|productid)[^)]*)\)[\s\S]{0,160}?\breturn\b",
        before_async,
        re.I,
    )
    identity_state = bool(
        re.search(r"\bproductId\s*:", source)
        or re.search(r"\b(?:WeakMap|Map)\s*\(", source)
    )
    invalidates_reuse = bool(re.search(
        r"this\.loaded\s*=\s*false|this\.productId\s*=\s*(?:productId|['\"]{2})|"
        r"(?:activeLoads|pendingLoads)\.set\s*\(\s*this",
        before_async,
        re.I,
    ))
    guarded_late_write = bool(
        strict_state_comparison(
            after_async,
            ("version", "generation", "requestid", "token", "sequence", "epoch"),
        )
        or re.search(
            r"(?:activeLoads|pendingLoads)\.get\s*\(\s*this\s*\)\s*!==\s*[A-Za-z_$][\w$]*",
            after_async,
        )
    )
    if not identity_state or not reuse or not invalidates_reuse or not guarded_late_write:
        return False, f"outputs/{path}：同 ID 复用、新 ID 立即失效或晚到请求身份保护不完整。"
    return True, f"outputs/{path}：以 store 状态或请求记录完成同 ID 复用、新 ID 失效和 A→B→A 晚到写入保护。"


def joined_outputs(root, *paths):
    return "\n".join(read_output(root, path) for path in paths)


def check_q0(root):
    path = "src/app.mpx"
    source = read_output(root, path)
    installed = (
        re.search(r"import\s+mpx\s+from\s+['\"]@mpxjs/core['\"]", source)
        and re.search(r"import\s+apiProxy\s+from\s+['\"]@mpxjs/api-proxy['\"]", source)
        and re.search(
            r"mpx\.use\s*\(\s*apiProxy\s*,\s*\{[\s\S]*?usePromise\s*:\s*true",
            source,
        )
    )
    if not installed:
        return False, f"outputs/{path}：未证明应用入口以 usePromise: true 安装 API Proxy。"
    return True, f"outputs/{path}：应用入口通过 mpx.use(apiProxy, {{ usePromise: true }}) 安装 API Proxy。"


def request_invalidation_before_abort(body):
    abort = re.search(r"\b[A-Za-z_$][\w$]*\.abort\s*\(", body)
    if not abort:
        return False
    invalidation = re.search(
        r"this\.[A-Za-z_$][\w$]*(?:task|request)[\w$]*\s*=\s*(?:null|undefined)|"
        r"this\.[A-Za-z_$][\w$]*(?:version|generation|token|sequence)[\w$]*\s*(?:\+\+|\+=\s*1|=)",
        body[:abort.start()],
        re.I,
    )
    return bool(invalidation)


def check_q2(root):
    page_path = "src/pages/search/index.mpx"
    service_path = "src/services/search.js"
    page = read_output(root, page_path)
    service = read_output(root, service_path)
    search = recursive_callable_context(page, "search")
    unload = recursive_callable_context(page, "onUnload") or recursive_callable_context(page, "detached")
    task_mode = re.search(r"(?:mpx\.)?request\s*\(\s*\{[\s\S]*?usePromise\s*:\s*false", service)
    saves_task = re.search(
        r"this\.[A-Za-z_$][\w$]*(?:task|request)[\w$]*\s*=\s*[A-Za-z_$][\w$]*",
        search,
        re.I,
    )
    if not task_mode or not saves_task:
        return False, f"outputs/{service_path} / outputs/{page_path}：联想请求未以 usePromise: false 返回并保存 RequestTask。"
    if not request_invalidation_before_abort(search) or not request_invalidation_before_abort(unload):
        return False, f"outputs/{page_path}：连续搜索或卸载没有在 abort 前先废弃当前任务身份。"
    return True, f"outputs/{page_path}：联想请求保存可取消任务，连续搜索与卸载均先废弃身份再 abort。"


def check_q3(root):
    path = "src/pages/search/index.mpx"
    source = read_output(root, path)
    body = recursive_callable_context(source, "search")
    task_guard = strict_state_comparison(body, ("task", "request"))
    keyword_guard = strict_state_comparison(body, ("keyword", "query"))
    generation_guard = has_generation_guard(body) and has_generation_advance(body)
    if not task_guard or not (keyword_guard or generation_guard):
        return False, f"outputs/{path}：联想回调未同时证明当前任务身份与当前关键词/请求代际。"
    return True, f"outputs/{path}：联想回调使用任务身份和关键词或请求代际拒绝晚到响应。"


def check_n0(root):
    path = "src/pages/checkout/index.mpx"
    source = read_output(root, path)
    body = recursive_callable_context(source, "chooseAddress")
    success = re.search(r"\bsuccess\s*(?::|\()", body)
    if not (
        re.search(r"mpx\.navigateTo\s*\(\s*\{", body)
        and re.search(r"\bevents\s*:\s*\{", body)
        and success
        and re.search(r"\.eventChannel\.emit\s*\(", body[success.end():])
    ):
        return False, f"outputs/{path}：chooseAddress 未完整建立 navigateTo EventChannel 双向通道。"
    return True, f"outputs/{path}：navigateTo.events 接收地址，success 中的 eventChannel 向地址页发送当前值。"


def check_n1(root):
    path = "src/pages/address/select.mpx"
    source = read_output(root, path)
    context = joined_outputs(root, path)
    if not (
        re.search(r"(?:this\.)?getOpenerEventChannel\s*\(\)", context)
        and re.search(r"\.emit\s*\(", context)
        and re.search(r"mpx\.navigateBack\s*\(", context)
    ):
        return False, f"outputs/{path}：地址页未通过页面实例 EventChannel 回传并 navigateBack。"
    return True, f"outputs/{path}：地址页获取 opener EventChannel，emit 地址后返回上一页。"


def check_n2(root):
    checkout_path = "src/pages/checkout/index.mpx"
    source = joined_outputs(root, checkout_path, "src/pages/address/select.mpx")
    required = ("navigateTo", "navigateBack", "redirectTo", "reLaunch", "switchTab")
    missing = [name for name in required if not re.search(rf"mpx\.{name}\s*\(", source)]
    wrong_tab = re.search(r"mpx\.navigateTo\s*\(\s*\{[^}]*url\s*:\s*['\"]/pages/orders/index", source, re.S)
    if missing or wrong_tab:
        return False, f"outputs/{checkout_path}：路由 API 语义不完整或仍用 navigateTo 打开订单 tab；缺少 {missing}。"
    return True, f"outputs/{checkout_path}：五类 Mpx 路由 API 按普通页、返回、替换、重启与 tab 语义使用。"


def check_n3(root):
    path = "src/pages/checkout/index.mpx"
    source = read_output(root, path)
    values = re.findall(r"open-type\s*=\s*['\"]([^'\"]+)['\"]", source)
    if "navigate" not in values or any(value in ("navigateTo", "switchTab") for value in values):
        return False, f"outputs/{path}：navigator open-type 未使用稳定值 navigate，或误用了 API 名/不稳定 switchTab 值。"
    return True, f"outputs/{path}：navigator 使用 open-type=\"navigate\"，tab 切换留给 mpx.switchTab。"


def config_has_path(source, base):
    escaped = re.escape(base)
    return bool(
        re.search(r"routeConfig\s*(?::|=)\s*\{[\s\S]*?mode\s*:\s*['\"]history['\"][\s\S]*?base\s*:\s*['\"]" + escaped + r"['\"]", source)
        or re.search(r"routeConfig\s*(?::|=)\s*\{[\s\S]*?base\s*:\s*['\"]" + escaped + r"['\"][\s\S]*?mode\s*:\s*['\"]history['\"]", source)
    ) and bool(re.search(r"publicPath\s*:\s*['\"]" + escaped + r"['\"]", source))


def check_n4(root):
    source = joined_outputs(root, "src/app.mpx", "vue.config.js")
    recommended = (
        re.search(r"mpx\.config\.webConfig\.routeConfig\s*=", source)
        or re.search(r"\bwebConfig\s*:\s*\{[\s\S]*?\brouteConfig\s*:", source)
    )
    legacy = re.search(r"(?:mpx\.config\.)?webRouteConfig\s*(?::|=)", source)
    if not recommended or not config_has_path(source, "/shop/") or legacy:
        return False, "outputs/src/app.mpx / outputs/vue.config.js：未通过推荐 routeConfig 对齐 history、/shop/ base 与 publicPath。"
    return True, "outputs/src/app.mpx / outputs/vue.config.js：runtime routeConfig 与构建 publicPath 均对齐 /shop/。"


def check_b0(root):
    path = "src/pages/feed/index.mpx"
    source = read_output(root, path)
    scroll = re.search(r"<scroll-view\b[^>]*>", source, re.I)
    sticky = re.search(r"<sticky-header\b", source, re.I)
    if not scroll or not sticky or sticky.start() < scroll.end():
        return False, f"outputs/{path}：找不到 scroll-view 内的 sticky-header。"
    between = re.sub(r"<!--[\s\S]*?-->", "", source[scroll.end():sticky.start()])
    if re.search(r"<(?:view|block|scroll-view|sticky-section)\b", between, re.I):
        return False, f"outputs/{path}：sticky-header 不是 scroll-view 的直接子节点。"
    scroll_end = source.find("</scroll-view>", sticky.start())
    fixed_nodes = re.findall(r"<[^>]+class\s*=\s*['\"][^'\"]*fixed[^'\"]*['\"][^>]*>", source[scroll.end():scroll_end], re.I)
    if fixed_nodes:
        return False, f"outputs/{path}：scroll-view 变换内容中仍放置了 viewport fixed 业务节点。"
    return True, f"outputs/{path}：sticky-header 为内建滚动直接子节点，常驻 fixed 入口位于变换内容之外。"


def check_b1(root):
    path = "src/pages/feed/index.mpx"
    source = read_output(root, path)
    tag = re.search(r"<scroll-view\b[^>]*>", source, re.I | re.S)
    if not tag:
        return False, f"outputs/{path}：缺少 scroll-view。"
    text = tag.group(0)
    missing = [name for name in ("binddragstart", "binddragging", "binddragend") if name not in text]
    enhanced = re.search(r"\benhanced(?:\s|=|/|>)", text)
    if missing or not enhanced:
        return False, f"outputs/{path}：增强手势缺少 enhanced 或事件不完整：{missing}。"
    return True, f"outputs/{path}：enhanced 与 dragstart/dragging/dragend 成组启用。"


def check_b2(root):
    path = "src/pages/feed/index.mpx"
    source = read_output(root, path)
    tag = re.search(r"<scroll-view\b[^>]*>", source, re.I | re.S)
    text = tag.group(0) if tag else ""
    ref = re.search(r"\b(?:ref@web|ref)\s*=\s*['\"]([A-Za-z_$][\w$]*)['\"]", text)
    imperative_refresh = False
    if ref:
        escaped = re.escape(ref.group(1))
        ref_access = (
            rf"this\.\$refs(?:\.{escaped}\b|\[\s*['\"]{escaped}['\"]\s*\])"
        )
        alias = re.search(
            rf"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*{ref_access}",
            source,
        )
        refresh_call = re.search(rf"{ref_access}\s*\.refresh\s*\(", source)
        if alias:
            refresh_call = refresh_call or re.search(
                rf"\b{re.escape(alias.group(1))}\.refresh\s*\(", source
            )
        next_tick = re.search(r"(?:this\.)?\$?nextTick\s*\(", source)
        web_guard = re.search(
            r"__mpx_mode__\s*(?:===|!==)\s*['\"]web['\"]", source
        )
        image_load = re.search(
            r"<image\b[^>]*(?:bindload|@load)\s*=\s*['\"][^'\"]+['\"]",
            source,
            re.I | re.S,
        )
        imperative_refresh = bool(refresh_call and next_tick and web_guard and image_load)
    if not imperative_refresh:
        return False, f"outputs/{path}：图片尺寸晚到后缺少 image load + nextTick + scroll-view ref.refresh 的真实刷新链路。"
    return True, f"outputs/{path}：图片 load 后经 Web nextTick 调用 scroll-view ref.refresh，覆盖固有尺寸晚到。"


def web_css_projection(source):
    """Return CSS that applies to Web for the simple Mpx conditional forms used by fixtures."""
    conditional = re.compile(
        r"/\*\s*@mpx-if\s*\((?P<condition>.*?)\)\s*\*/"
        r"(?P<if_body>.*?)"
        r"(?:/\*\s*@mpx-else\s*\*/(?P<else_body>.*?))?"
        r"/\*\s*@mpx-endif\s*\*/",
        re.I | re.S,
    )

    def choose_branch(match):
        condition = match.group("condition")
        equals_web = re.search(
            r"(?:__mpx_mode__|mode)\s*={2,3}\s*['\"]web['\"]",
            condition,
            re.I,
        )
        excludes_web = re.search(
            r"(?:__mpx_mode__|mode)\s*!={1,2}\s*['\"]web['\"]",
            condition,
            re.I,
        )
        if equals_web:
            return match.group("if_body")
        if excludes_web:
            return match.group("else_body") or ""
        return match.group(0)

    web_css = []
    for style in re.finditer(
        r"<style\b(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</style>",
        source,
        re.I,
    ):
        attrs = style.group("attrs")
        mode = re.search(r"\bmode\s*=\s*['\"]([^'\"]+)['\"]", attrs, re.I)
        if mode and mode.group(1).lower() != "web":
            continue
        css = style.group("body")
        if not mode:
            previous = None
            while previous != css:
                previous = css
                css = conditional.sub(choose_branch, css)
        web_css.append(css)
    return "\n".join(web_css)


def check_b3(root):
    path = "src/pages/feed/index.mpx"
    source = read_output(root, path)
    scroll = re.search(r"<scroll-view\b[^>]*>", source, re.I | re.S)
    cart = re.search(
        r"<[^>]+\bclass\s*=\s*['\"][^'\"]*\bfixed-cart\b[^'\"]*['\"][^>]*>",
        source,
        re.I | re.S,
    )
    if not scroll or not cart:
        return False, f"outputs/{path}：找不到 scroll-view 或 fixed-cart 常驻入口。"
    scroll_end = source.find("</scroll-view>", scroll.end())
    if scroll_end < 0:
        return False, f"outputs/{path}：scroll-view 结构未闭合，无法验证 fixed-cart 所在层级。"
    if scroll.end() < cart.start() < scroll_end:
        return False, f"outputs/{path}：fixed-cart 仍是 scroll-view 变换内容的后代。"

    web_css = web_css_projection(source)
    positions = []
    for rule in re.finditer(
        r"[^{}]*\.fixed-cart\b[^{}]*\{(?P<body>[^{}]*)\}",
        web_css,
        re.I | re.S,
    ):
        positions.extend(re.findall(
            r"\bposition\s*:\s*([A-Za-z-]+)",
            rule.group("body"),
            re.I,
        ))
    if not positions:
        return False, f"outputs/{path}：找不到 Web 生效的 fixed-cart position 声明。"
    final_position = positions[-1].lower()
    if final_position != "fixed":
        return False, (
            f"outputs/{path}：fixed-cart 已移出变换内容，但 Web 最终 position 为 "
            f"{final_position}，没有保持相对浏览器视口的 fixed 语义。"
        )
    return True, f"outputs/{path}：fixed-cart 位于变换内容之外，且 Web 最终 position 为 fixed。"


def check_b4(root):
    path = "src/components/product-video.mpx"
    source = read_output(root, path)
    tag = re.search(r"<video\b[^>]*>", source, re.I | re.S) or re.search(r"<video\b[^>]*/>", source, re.I | re.S)
    if not tag:
        return False, f"outputs/{path}：缺少 video。"
    text = tag.group(0)
    if re.search(r"\bautoplay(?:\s|=|/|>)", text):
        muted = re.search(
            r"\bmuted(?:@web)?(?:\s|=\s*['\"](?:true|\{\{\s*true\s*\}\})['\"]|/|>)",
            text,
        )
        controllable = not re.search(r"controls\s*=\s*['\"](?:false|\{\{\s*false\s*\}\})['\"]", text) or "bindtap" in text
        if not muted or not controllable:
            return False, f"outputs/{path}：autoplay 未同时提供静音与用户可继续播放入口。"
    return True, f"outputs/{path}：视频自动播放配置符合静音/用户手势策略。"


def check_b5(root):
    path = "src/components/product-video.mpx"
    source = read_output(root, path)
    checks = (
        ("timeupdate", "onTimeUpdate", "currentTime"),
        ("loadedmetadata", "onLoadedMetadata", "width"),
    )
    failures = []
    for event_name, name, field in checks:
        web_binding = re.search(
            rf"(?:bind|@){event_name}@web\s*=\s*['\"]([A-Za-z_$][\w$]*)['\"]",
            source,
            re.I,
        )
        if web_binding:
            web_body = method_body(source, web_binding.group(1))
            if re.search(r"event\.(?:currentTarget|target)\b", web_body):
                continue
        body = method_body(source, name)
        if re.search(rf"event\.detail\.{field}\b", body) and not re.search(
            r"(?:currentTarget|target|__mpx_mode__|typeof\s+event\.detail)", body
        ):
            failures.append(name)
    if failures:
        return False, f"outputs/{path}：{', '.join(failures)} 仍无条件假定微信 detail 结构。"
    return True, f"outputs/{path}：timeupdate 与 loadedmetadata 同时兼容 Web 转发事件和小程序 detail。"


def check_b6(root):
    page_path = "src/pages/feed/index.mpx"
    video_path = "src/components/product-video.mpx"
    page = read_output(root, page_path)
    video = read_output(root, video_path)
    tag = re.search(r"<video\b[^>]*?/?>", video, re.I | re.S)
    if not tag:
        return False, f"outputs/{video_path}：缺少 video。"

    unsupported = (
        "duration", "danmu-list", "danmu-btn", "enable-danmu", "direction",
        "enable-progress-gesture", "title", "play-btn-position", "enable-play-gesture",
        "vslide-gesture", "vslide-gesture-in-fullscreen", "ad-unit-id", "poster-for-crawle",
        "show-casting-button", "picture-in-picture-mode", "picture-in-picture-show-progress",
        "enable-auto-rotation", "show-screen-lock-button",
    )
    leaked = [
        name for name in unsupported
        if re.search(rf"\b{re.escape(name)}\b(?!@wx\b)", tag.group(0), re.I)
    ]
    if leaked:
        return False, f"outputs/{video_path}：Web video 仍暴露未实际消费的属性 {leaked}。"

    business = {
        "分类": re.search(r"categor", page, re.I) and re.search(r"(?:bindtap|@tap)", page),
        "增强滚动": all(token in page for token in ("binddragstart", "binddragging", "binddragend")),
        "商品视频": re.search(r"<product-video\b", page, re.I),
        "购物车": re.search(r"cart", page, re.I) and re.search(r"(?:bindtap|@tap)", page),
        "视频事件": all(token in video for token in ("bindtimeupdate", "bindloadedmetadata", "binderror")),
    }
    missing = [name for name, present in business.items() if not present]
    if missing:
        return False, f"outputs/{page_path} / outputs/{video_path}：跨端业务链路缺少 {missing}。"
    return True, f"outputs/{page_path} / outputs/{video_path}：Web 视频属性受支持且分类、滚动、视频、购物车链路完整。"


def check_v0(root):
    path = "src/components/analytics-panel.mpx"
    source = read_output(root, path)
    forbidden = re.search(r"(?:\.vue['\"]|/web/|chart-sdk|\bwindow\b|\bdocument\b|ResizeObserver|from\s+['\"]vue['\"])", source)
    business = "metrics" in source and re.search(r"(?:bindtap|@tap)", source) and "triggerEvent" in source
    if forbidden or not business:
        return False, f"outputs/{path}：通用摘要卡混入 Web 依赖，或指标点击业务不完整。"
    return True, f"outputs/{path}：小程序摘要卡独立可执行，未进入 Web-only 依赖图。"


def check_v2(root):
    path = "src/web/AnalyticsChart.vue"
    source = read_output(root, path)
    forbidden = re.search(r"<script\s+setup|\bcreateApp\s*\(|\bdefineProps\s*\(|<Teleport\b|\bonMounted\s*\(", source, re.I)
    if forbidden or not re.search(r"export\s+default\s*\{", source):
        return False, f"outputs/{path}：仍使用 Vue 3 专属 SFC/挂载 API，或没有 Vue 2.7 组件导出。"
    return True, f"outputs/{path}：Vue SFC 使用 Vue 2.7 兼容的组件选项。"


def check_v4(root):
    common = read_output(root, "src/components/analytics-panel.mpx")
    source = joined_outputs(
        root,
        "src/components/analytics-panel.web.mpx",
        "src/web/AnalyticsChart.vue",
    )
    if re.search(r"chart-sdk|\.vue['\"]|\bwindow\b|\bdocument\b", common):
        return False, "outputs/src/components/analytics-panel.mpx：Web 图表依赖进入了通用模块。"
    _, body = find_method(source, lambda candidate: bool(re.search(r"\bawait\b", candidate)))
    awaits = list(re.finditer(r"\bawait\b", body))
    static_web_import = re.search(
        r"^\s*import\s+[^\n]*['\"][^'\"]*chart-sdk[^'\"]*['\"]",
        source,
        re.M,
    )
    if not awaits and static_web_import:
        return True, "Web-only 文件静态加载 DOM-safe 图表 SDK，不存在异步挂载边界。"
    guard = re.compile(
        r"(?:signal\s*\.\s*aborted|detached|destroyed|inactive|generation|version|token|sequence|isCurrent)",
        re.I,
    )
    guarded_boundaries = bool(awaits) and all(
        guard.search(
            body[match.end() : awaits[index + 1].start() if index + 1 < len(awaits) else len(body)]
        )
        for index, match in enumerate(awaits)
    )
    guarded_destroy = re.search(
        r"if\s*\([^)]*(?:signal\s*\.\s*aborted|detached|destroyed|inactive|generation|version|token|sequence|isCurrent)[^)]*\)"
        r"[\s\S]{0,300}?\.destroy\s*\(",
        body,
        re.I,
    )
    if not body or not guarded_boundaries or not guarded_destroy:
        return False, "outputs/src/components/analytics-panel.web.mpx / outputs/src/web/AnalyticsChart.vue：SDK import/create 异步边界缺少卸载/代际保护。"
    return True, "Web 图表动态加载 SDK，以代际状态或 AbortSignal 检查每个异步边界，并销毁晚到实例。"


def check_v5(root):
    component_source = joined_outputs(root, "src/components/analytics-panel.web.mpx", "src/web/AnalyticsChart.vue")
    all_source = joined_outputs(
        root,
        "src/components/analytics-panel.web.mpx",
        "src/web/AnalyticsChart.vue",
        "src/web/chart-sdk.js",
    )
    cleanup = "\n".join(
        recursive_method_context(component_source, name)
        for name in ("detached", "beforeDestroy", "destroyChart", "cleanup", "dispose")
    )
    destroys_instance = re.search(r"\.destroy\s*\(", cleanup)
    disconnects_observer = not re.search(r"\bResizeObserver\b", all_source) or re.search(r"\.disconnect\s*\(", cleanup)
    added_listeners = len(re.findall(r"\baddEventListener\s*\(", all_source))
    removed_listeners = len(re.findall(r"\bremoveEventListener\s*\(", all_source))
    cleans_listeners = not added_listeners or removed_listeners >= added_listeners
    if not destroys_instance or not disconnects_observer or not cleans_listeners:
        return False, "Web 图表销毁流程未同时覆盖实例、ResizeObserver 与事件监听。"
    return True, "Web 图表卸载流程销毁实例、断开 ResizeObserver，SDK/helper 也成对移除其内部监听。"


def check_v6(root):
    config_path = "vue.config.js"
    component_path = "src/web/AnalyticsScroll.vue"
    config = read_output(root, config_path)
    component = read_output(root, component_path)
    valid_key = re.search(r"customBuiltInComponents\s*:\s*\{[\s\S]*?['\"]?scroll-view['\"]?\s*:", config)
    passthrough = "<slot" in component and "$attrs" in component and "$listeners" in component
    if not valid_key or not passthrough:
        return False, f"outputs/{config_path} / outputs/{component_path}：自定义内建 key 或属性/事件/slot 透传不完整。"
    return True, f"outputs/{config_path}：以 scroll-view 覆盖内建实现，Vue 组件透传 attrs/listeners/default slot。"


def check_x0(root):
    path = "src/app.mpx"
    source = read_output(root, path)
    body = method_body(source, "onAppInit")
    created = re.search(r"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*createPinia\s*\(\)", body)
    returned_object = re.search(r"\breturn\s*\{([^{}]*)\}", body, re.S)
    object_body = returned_object.group(1) if returned_object else ""
    inline = re.search(r"\bpinia\s*:\s*createPinia\s*\(\)", object_body)
    returned = bool(inline)
    if created:
        variable = created.group(1)
        explicit = re.search(
            rf"\bpinia\s*:\s*{re.escape(variable)}\b", object_body
        )
        shorthand = variable == "pinia" and re.search(
            r"(?:^|,)\s*pinia\s*(?:,|$)", object_body
        )
        returned = bool(explicit or shorthand)
    if not returned:
        return False, f"outputs/{path}：onAppInit 未在函数体内创建并返回请求级 Pinia。"
    return True, f"outputs/{path}：每次 onAppInit 调用都创建并返回独立 Pinia。"


def check_x1(root):
    path = "src/pages/article/detail.mpx"
    source = read_output(root, path)
    body = recursive_method_context(source, "serverPrefetch")
    if not re.search(r"\breturn\b|\bawait\b", body) or "$ssrContext" not in body or "loadArticle" not in body:
        return False, f"outputs/{path}：serverPrefetch 未返回等待结果或未传递 $ssrContext。"
    return True, f"outputs/{path}：serverPrefetch 等待文章加载并沿调用链传递请求上下文。"


def check_x2(root):
    path = "src/stores/article.js"
    source = read_output(root, path)
    state = re.search(r"state\s*:\s*\(\)\s*=>\s*\(\{([\s\S]*?)\}\)", source)
    state_text = state.group(1) if state else ""
    fields = all(re.search(pattern, state_text, re.I) for pattern in (r"articleId", r"loaded", r"(?:version|generation|token|sequence)"))
    body = method_body(source, "loadArticle")
    reuse = re.search(r"this\.loaded\s*&&\s*this\.articleId\s*===\s*articleId", body)
    invalidate = re.search(r"this\.articleId\s*=\s*articleId[\s\S]{0,160}?this\.loaded\s*=\s*false", body)
    identity = has_generation_advance(body) and has_generation_guard(body) and strict_state_comparison(body, ("articleid",))
    if not fields or not reuse or not invalidate or not identity:
        return False, f"outputs/{path}：文章注水复用和 A→B→A 请求身份状态机不完整。"
    return True, f"outputs/{path}：store 以 articleId/loaded/请求代际保护注水复用和晚到写入。"


def check_x3(root):
    path = "src/pages/article/detail.mpx"
    source = read_output(root, path)
    nondeterministic = re.search(r"Math\.random\s*\(|Date\.now\s*\(|new\s+Date\s*\(", source)
    browser_tag = re.search(
        r"<[^>]*\bclass\s*=\s*['\"][^'\"]*(?:share|browser|client)[^'\"]*['\"][^>]*>",
        source,
        re.I | re.S,
    )
    condition = ""
    if browser_tag:
        match = re.search(r"wx:if\s*=\s*['\"]\{\{([^}]*)\}\}['\"]", browser_tag.group(0))
        condition = match.group(1) if match else ""
    flags = re.findall(r"\b([A-Za-z_$][\w$]*)\s*:\s*false\b", source)
    active_flags = [flag for flag in flags if re.search(rf"\b{re.escape(flag)}\b", condition)]
    ready = "\n".join(method_body(source, name) for name in ("ready", "mounted", "attached"))
    ready_true = any(re.search(
        rf"this\.{re.escape(flag)}\s*=\s*(?:true|typeof\s+window\s*!==\s*['\"]undefined['\"])",
        ready,
    ) for flag in active_flags)
    if nondeterministic or (browser_tag and (not active_flags or not ready_true)):
        return False, f"outputs/{path}：SSR 首屏仍含非确定值，或客户端专属节点未在挂载后开启。"
    return True, f"outputs/{path}：首屏结构确定，浏览器专属节点只在客户端挂载后出现。"


def check_x4(root):
    path = "src/app.mpx"
    source = read_output(root, path)
    body = method_body(source, "onSSRAppCreated")
    if not body:
        return True, f"outputs/{path}：删除自定义 onSSRAppCreated，使用框架默认 router ready 与状态写入流程。"
    requirements = (
        r"router\.push\s*\(\s*context\.url",
        r"router\.onReady\s*\(",
        r"context\.state\s*=",
        r"pinia\.state\.value",
        r"\breturn\s+app\b|resolve\s*\(\s*app",
    )
    if any(not re.search(pattern, body) for pattern in requirements) or not re.search(r"(?:reject|onError|catch)", body):
        return False, f"outputs/{path}：自定义 onSSRAppCreated 未完整保留路由 ready、错误、状态和 app 返回契约。"
    return True, f"outputs/{path}：自定义 SSR 启动流程覆盖 push/onReady/error/state/app。"


def check_x5(root):
    path = "vue.config.js"
    source = read_output(root, path)
    if not config_has_path(source, "/content/") or not re.search(r"useSSR\s*:\s*true", source):
        return False, f"outputs/{path}：异步 SSR 未对齐 history/useSSR/base/publicPath。"
    return True, f"outputs/{path}：history、useSSR 与 /content/ 部署路径一致。"


def check_x6(root):
    path = "src/services/article.js"
    source = read_output(root, path)
    forbidden = re.search(r"\b(?:window|document|navigator|location)\b|localhost", source)
    context = re.search(
        r"(?:\b[A-Za-z_$][\w$]*\s*&&\s*)?\b[A-Za-z_$][\w$]*(?:\?\.|\.)req\b",
        source,
    )
    relative = re.search(
        r"['\"]/api/articles/|`/api/articles/|\$\{[A-Za-z_$][\w$]*\}/api/articles/",
        source,
    )
    promise = re.search(r"\breturn\b[\s\S]*?(?:mpx\.request\s*\(|\.then\s*\(|await\b)", source)
    if forbidden or not context or not relative or not promise:
        return False, f"outputs/{path}：同构 service 未从 requestContext.req 取服务端 origin，或仍依赖浏览器/localhost/非 Promise 请求。"
    return True, f"outputs/{path}：服务端 origin 来自 requestContext.req，其他目标保持相对 URL 和 Promise 返回。"


def check_x7(root):
    path = "src/pages/article/detail.mpx"
    source = read_output(root, path)
    body = recursive_method_context(source, "onLoad")
    if "loadArticle" not in body:
        return False, f"outputs/{path}：小程序 onLoad 的文章业务加载缺失或仍被浏览器守卫包围。"
    browser_guard = re.search(r"\bwindow\b|\bdocument\b|\bnavigator\b", body)
    non_web_path = re.search(
        r"__mpx_mode__\s*!={1,2}\s*['\"]web['\"][\s\S]{0,180}?loadArticle|"
        r"loadArticle[\s\S]{0,180}?__mpx_mode__\s*!={1,2}\s*['\"]web['\"]",
        body,
    )
    if browser_guard and not non_web_path:
        return False, f"outputs/{path}：onLoad 的文章加载仍只在浏览器对象存在时执行。"
    return True, f"outputs/{path}：onLoad 在无浏览器对象的小程序环境仍执行文章加载。"


def check_c2(root):
    path = "src/components/filter-dialog.web.mpx"
    source = read_output(root, path)
    open_body = recursive_method_context(source, "open")
    close_body = recursive_method_context(source, "close")
    trigger = re.search(r"document\.activeElement|event\s*&&\s*event\.currentTarget|event\.currentTarget|\$refs\.(?:trigger|filterTrigger)", open_body)
    if not trigger or not re.search(r"(?:\$nextTick|nextTick)", open_body) or not re.search(r"\.focus\s*\(", open_body):
        return False, f"outputs/{path}：打开流程未记录触发元素并在渲染后移入焦点。"
    connected = re.search(r"isConnected|document(?:\.(?:documentElement|body))?\.contains\s*\(", close_body)
    if not connected or not re.search(r"\.focus\s*\(", close_body):
        return False, f"outputs/{path}：关闭流程未安全恢复仍在文档中的触发元素焦点。"
    return True, f"outputs/{path}：焦点进入和安全恢复链路完整。"


def check_c3(root):
    path = "src/components/filter-dialog.web.mpx"
    source = read_output(root, path)
    context = recursive_method_context(source, "onKeydown")
    escape = re.search(r"(?:key|code)\s*===?\s*['\"]Escape['\"]", context)
    tab = re.search(r"(?:key|code)\s*(?:===?|!==?)\s*['\"]Tab['\"]", context)
    cycle = "shiftKey" in context and re.search(r"(?:focusable|focusables|first|last)", context, re.I)
    mask_safe = re.search(r"(?:@click\.self|@click\.stop|stopPropagation\s*\()", source)
    if not escape or not tab or not cycle or not mask_safe:
        return False, f"outputs/{path}：Escape、Tab/Shift+Tab 循环或遮罩事件隔离不完整。"
    return True, f"outputs/{path}：键盘关闭、双向焦点循环与遮罩点击隔离完整。"


def check_c4(root):
    path = "src/components/filter-dialog.web.mpx"
    source = read_output(root, path)
    adds = len(re.findall(r"addEventListener\s*\(\s*['\"](?:keydown|focusin)['\"]", source))
    removes = len(re.findall(r"removeEventListener\s*\(\s*['\"](?:keydown|focusin)['\"]", source))
    if not adds:
        return True, f"outputs/{path}：未注册 document/window 全局键盘或焦点监听，无需全局清理。"
    cleanup = "\n".join(
        recursive_method_context(source, name)
        for name in ("detached", "beforeDestroy", "unmounted")
    )
    close = recursive_method_context(source, "close")
    if removes < adds or "removeEventListener" not in cleanup or "removeEventListener" not in close:
        return False, f"outputs/{path}：键盘/焦点监听未在 close 与卸载流程成对移除。"
    return True, f"outputs/{path}：全局监听在关闭和卸载时幂等清理。"


def check_t1(root):
    path = "vue.config.js"
    source = read_output(root, path)
    body_match = re.search(r"transRpxFn\s*:\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}", source)
    body = body_match.group(1) if body_match else ""
    zero = re.search(r"if\s*\(\s*(?:Number\s*\()?value\)?\s*===?\s*(?:['\"]0['\"]|0)\s*\)\s*return\s+(?:value|0)", body)
    conversion = re.search(r"value\s*\*\s*0\.01|value\s*/\s*100", body)
    if not zero or not conversion:
        return False, f"outputs/{path}：transRpxFn 未同时证明 0 保持和 100rpx=1rem。"
    return True, f"outputs/{path}：rpx 转换规则稳定保留 0，并按 1/100 输出 rem。"


def check_t2(root):
    html_path = "public/index.html"
    page_path = "src/pages/portal/index.mpx"
    html = read_output(root, html_path)
    page = read_output(root, page_path)
    viewport = re.search(r"<meta\b[^>]*name\s*=\s*['\"]viewport['\"][^>]*content\s*=\s*['\"][^'\"]*width=device-width", html, re.I)
    if not viewport or re.search(r"createElement\s*\(\s*['\"]meta['\"]|name\s*=\s*['\"]viewport['\"]", page):
        return False, f"outputs/{html_path}：viewport 未由 HTML 模板唯一负责。"
    return True, f"outputs/{html_path}：移动 viewport 在 HTML 模板中配置，组件未重复注入。"


def check_t3(root):
    path = "src/pages/portal/index.mpx"
    source = read_output(root, path)
    features_found = False
    unguarded = []
    for style in re.finditer(r"<style\b(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</style>", source, re.I):
        attrs = style.group("attrs")
        body = style.group("body")
        features = list(re.finditer(r":hover|::-webkit-scrollbar|safe-area-inset", body))
        if not features:
            continue
        features_found = True
        if re.search(r"\bmode\s*=\s*['\"]web['\"]", attrs, re.I):
            continue
        ranges = []
        for guard in re.finditer(r"@mpx-if[^\n]*__mpx_mode__\s*===\s*['\"]web['\"]", body):
            end = re.search(r"@mpx-endif", body[guard.end():])
            if end:
                ranges.append((guard.start(), guard.end() + end.end()))
        unguarded.extend(
            match.group(0)
            for match in features
            if not any(start <= match.start() <= end for start, end in ranges)
        )
    if not features_found or unguarded:
        return False, f"outputs/{path}：Web-only hover/滚动条/safe-area CSS 未最小条件隔离。"
    return True, f"outputs/{path}：浏览器专属 CSS 位于 Web 条件块。"


def check_t4(root):
    path = "src/pages/portal/index.mpx"
    source = read_output(root, path)
    open_body = recursive_method_context(source, "openDialog")
    close_body = recursive_method_context(source, "closeDialog")
    unload = "\n".join(
        recursive_method_context(source, name)
        for name in ("onHide", "onUnload", "detached", "unmounted")
    )

    html = read_output(root, "public/index.html")
    requires_app = bool(re.search(r"id\s*=\s*['\"]app['\"]", html, re.I))
    has_body_target = "document.body" in open_body
    has_app_target = bool(re.search(
        r"(?:getElementById\s*\(\s*['\"]app['\"]|querySelector\s*\(\s*['\"]#app['\"])",
        open_body,
        re.I,
    ))
    required_target_count = 2 if requires_app else 1
    saved_overflow_count = len(re.findall(
        r"this\.[A-Za-z_$][\w$]*\s*=\s*(?:document\.body|[A-Za-z_$][\w$]*)\.style\.overflow\b",
        open_body,
        re.I,
    ))

    direct_state = re.search(
        r"this\.([A-Za-z_$][\w$]*)\s*=\s*(?:document\.body|[A-Za-z_$][\w$]*)\.style\.overflow\b",
        open_body,
        re.I,
    )
    object_state = re.search(
        r"this\.([A-Za-z_$][\w$]*)\s*=\s*\{([\s\S]{0,1800}?)\}",
        open_body,
        re.I,
    )
    object_saves_overflow = object_state and re.search(
        r"\.style\.overflow\b|\.style\.getPropertyValue\s*\(\s*['\"]overflow['\"]\s*\)",
        object_state.group(2),
        re.I,
    )
    object_saved_count = len(re.findall(
        r"\.style\.overflow\b|\.style\.getPropertyValue\s*\(\s*['\"]overflow['\"]\s*\)",
        object_state.group(2) if object_state else "",
        re.I,
    ))
    state_name = (
        direct_state.group(1)
        if direct_state
        else object_state.group(1) if object_saves_overflow else ""
    )
    locked = re.search(
        r"\.style\.overflow\s*=\s*['\"]hidden['\"]"
        r"|\.style\.setProperty\s*\(\s*['\"]overflow['\"]\s*,\s*['\"]hidden['\"]",
        open_body,
        re.I,
    )
    restore_pattern = re.compile(
        r"\.style\.overflow\s*=\s*(?:this\.)?[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?"
        r"|\.style\.(?:setProperty|removeProperty)\s*\(\s*['\"]overflow['\"]",
        re.I,
    )
    restored_close = restore_pattern.search(close_body)
    restored_unload = restore_pattern.search(unload)
    idempotent = bool(direct_state)
    if object_saves_overflow and state_name:
        escaped = re.escape(state_name)
        guarded_restore = re.search(
            rf"if\s*\([^)]*!\s*this\.{escaped}\b[^)]*\)\s*return", close_body
        )
        reset = re.search(rf"this\.{escaped}\s*=\s*null\b", close_body)
        idempotent = bool(guarded_restore and reset)
    targets_complete = (
        has_body_target
        and (not requires_app or has_app_target)
        and max(saved_overflow_count, object_saved_count) >= required_target_count
    )
    if not targets_complete or not state_name or not locked or not restored_close or not restored_unload or not idempotent:
        return False, f"outputs/{path}：滚动锁未保存原值，或关闭/卸载没有幂等恢复。"
    return True, f"outputs/{path}：Web 滚动锁保存原 overflow，并通过直接赋值或 CSSOM 在关闭、切页与卸载时幂等恢复。"


def check_t5(root):
    path = "src/pages/portal/index.mpx"
    source = read_output(root, path)
    for name in ("openDialog", "closeDialog"):
        body = recursive_method_context(source, name)
        has_dom = re.search(r"\bdocument\b|\bwindow\b", body)
        has_client_guard = re.search(
            r"\bif\s*\([^)]*(?:"
            r"__mpx_mode__\s*(?:===|!==)\s*['\"]web['\"]|"
            r"typeof\s+(?:document|window)\s*(?:===|!==)\s*['\"]undefined['\"]"
            r")[^)]*\)",
            body,
        )
        if has_dom and not has_client_guard:
            return False, f"outputs/{path}：{name} 的 DOM 滚动逻辑未由 Web 客户端分支保护。"
    return True, f"outputs/{path}：DOM 滚动锁只在 Web 客户端执行，小程序业务方法仍可调用。"


def check_t6(root):
    path = "vue.config.js"
    source = read_output(root, path)
    if not config_has_path(source, "/portal/"):
        return False, f"outputs/{path}：routeConfig.base 与 publicPath 未对齐 /portal/。"
    return True, f"outputs/{path}：history 路由 base 与 publicPath 均为 /portal/。"


CHECKS = {
    "w0": check_w0,
    "a5": check_a5,
    "s1": check_s1,
    "r1": check_r1,
    "r4": check_r4,
    "r5": check_r5,
    "r6": check_r6,
    "r7": check_r7,
    "h1": check_h1,
    "h2": check_h2,
    "h3": check_h3,
    "h4": check_h4,
    "h5": check_h5,
    "h6": check_h6,
    "h7": check_h7,
    "h8": check_h8,
    "p0": check_p0,
    "p1": check_p1,
    "p2": check_p2,
    "p3": check_p3,
    "p4": check_p4,
    "p5": check_p5,
    "p6": check_p6,
    "p7": check_p7,
    "q0": check_q0,
    "q2": check_q2,
    "q3": check_q3,
    "n0": check_n0,
    "n1": check_n1,
    "n2": check_n2,
    "n3": check_n3,
    "n4": check_n4,
    "b0": check_b0,
    "b1": check_b1,
    "b2": check_b2,
    "b3": check_b3,
    "b4": check_b4,
    "b5": check_b5,
    "b6": check_b6,
    "v0": check_v0,
    "v2": check_v2,
    "v4": check_v4,
    "v5": check_v5,
    "v6": check_v6,
    "x0": check_x0,
    "x1": check_x1,
    "x2": check_x2,
    "x3": check_x3,
    "x4": check_x4,
    "x5": check_x5,
    "x6": check_x6,
    "x7": check_x7,
    "c2": check_c2,
    "c3": check_c3,
    "c4": check_c4,
    "t1": check_t1,
    "t2": check_t2,
    "t3": check_t3,
    "t4": check_t4,
    "t5": check_t5,
    "t6": check_t6,
}


RELIABILITY_CHECK_IDS = frozenset(CHECKS) | frozenset({"a0", "a6"})


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
        methods = expectation.setdefault("verification_methods", ["independent_code_review"])
        if "deterministic_check" not in methods:
            methods.append("deterministic_check")
    return expectations


PUBLIC_GROUPS = ("mpx2web", "previous_mpx2web", "no_skill")


def run_number(path):
    return int(path.name.removeprefix("run-"))


def audit_workspace(root, write_grades=False):
    public = json.loads((root / "evals.json").read_text())
    results = []
    totals = {}
    for item in public["evals"]:
        eval_root = root / f"eval-{item['id']}-{item['name']}"
        for group in PUBLIC_GROUPS:
            run_dirs = sorted(
                (
                    path for path in (eval_root / group).glob("run-*")
                    if path.is_dir() and path.name.removeprefix("run-").isdigit()
                ),
                key=run_number,
            )
            for run_root in run_dirs:
                grade_path = run_root / "grading.json"
                grade = json.loads(grade_path.read_text())
                expectations = grade["expectations"]
                by_id = {entry["id"]: entry for entry in expectations}
                for assertion in item["assertions"]:
                    by_id[assertion["id"]]["text"] = assertion["text"]
                    by_id[assertion["id"]].setdefault(
                        "verification_methods", ["independent_code_review"]
                    )
                expectations = apply_deterministic_checks(
                    item, expectations, run_root
                )
                passed = sum(entry["passed"] is True for entry in expectations)
                audited = dict(grade)
                audited["expectations"] = expectations
                audited["summary"] = {
                    "passed": passed,
                    "failed": len(expectations) - passed,
                    "total": len(expectations),
                    "pass_rate": round(passed / len(expectations), 4),
                }
                if write_grades:
                    grade_path.write_text(
                        json.dumps(audited, ensure_ascii=False, indent=2) + "\n"
                    )
                timing_path = run_root / "timing.json"
                timing = (
                    json.loads(timing_path.read_text())
                    if timing_path.is_file()
                    else {}
                )
                results.append({
                    "eval_id": item["id"],
                    "eval_name": item["name"],
                    "configuration": group,
                    "run_number": run_number(run_root),
                    **audited["summary"],
                    **timing,
                    "expectations": expectations,
                })
    for group in PUBLIC_GROUPS:
        rows = [row for row in results if row["configuration"] == group]
        passed = sum(row["passed"] for row in rows)
        total = sum(row["total"] for row in rows)
        totals[group] = {
            "runs": len(rows),
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
    parser = argparse.ArgumentParser(
        description="使用冻结的确定性检查器复核 iteration-11 三轮评分。"
    )
    parser.add_argument("workspace", nargs="?", type=Path, default=Path(__file__).parent)
    parser.add_argument("--summary", action="store_true", help="只输出汇总")
    parser.add_argument(
        "--write-grades",
        action="store_true",
        help="将修正后的确定性检查结果写回 grading.json；不重新生成候选或调用评分模型",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="将审计 JSON 写入指定文件；省略时输出到 stdout",
    )
    args = parser.parse_args()
    payload = audit_workspace(args.workspace.resolve(), args.write_grades)
    rendered = json.dumps(payload["totals"] if args.summary else payload, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered)
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
