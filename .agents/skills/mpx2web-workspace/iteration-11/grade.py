#!/usr/bin/env python3
import argparse
import hashlib
import html
import json
import re
import shutil
import statistics
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
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
    abort = re.search(r"\b[A-Za-z_$][\w$]*(?:\.__returned)?\.abort\s*\(", body)
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
    direct_task_mode = re.search(
        r"(?:(?:mpx|wx)\.)?request\s*\(\s*\{[\s\S]*?usePromise\s*:\s*false",
        service,
    )
    named_task_mode = (
        re.search(
            r"import\s*\{[^}]*\brequest\b[^}]*\}\s*from\s*['\"]@mpxjs/api-proxy['\"]",
            service,
        )
        and re.search(r"(?<![.\w$])request\s*\(", service)
    )
    promise_task_mode = (
        not direct_task_mode
        and re.search(r"(?:mpx|wx)\.request\s*\(", service)
        and re.search(r"\.__returned\b", page)
    )
    saves_task = re.search(
        r"this\.[A-Za-z_$][\w$]*(?:task|request)[\w$]*\s*=\s*[A-Za-z_$][\w$]*",
        search,
        re.I,
    )
    contexts = f"{search}\n{unload}"
    direct_abort = re.search(r"(?<!\.)\b[A-Za-z_$][\w$]*\.abort\s*\(", contexts)
    promise_abort = re.search(r"\b[A-Za-z_$][\w$]*\.__returned\.abort\s*\(", contexts)
    direct_contract = (direct_task_mode or named_task_mode) and direct_abort
    promise_contract = promise_task_mode and promise_abort
    if not (direct_contract or promise_contract) or not saves_task:
        return False, f"outputs/{service_path} / outputs/{page_path}：联想请求未保存直接 RequestTask 或 Promise.__returned 原始任务。"
    if not request_invalidation_before_abort(search) or not request_invalidation_before_abort(unload):
        return False, f"outputs/{page_path}：连续搜索或卸载没有在 abort 前先废弃当前任务身份。"
    mode = "直接 RequestTask" if direct_contract else "Promise.__returned 原始任务"
    return True, f"outputs/{page_path}：联想请求保存{mode}，连续搜索与卸载均先废弃身份再 abort。"


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
        re.search(r"(?:mpx|wx)\.navigateTo\s*\(\s*\{", body)
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
        and re.search(r"(?:mpx|wx)\.navigateBack\s*\(", context)
    ):
        return False, f"outputs/{path}：地址页未通过页面实例 EventChannel 回传并 navigateBack。"
    return True, f"outputs/{path}：地址页获取 opener EventChannel，emit 地址后返回上一页。"


def check_n2(root):
    checkout_path = "src/pages/checkout/index.mpx"
    source = joined_outputs(root, checkout_path, "src/pages/address/select.mpx")
    required = ("navigateTo", "navigateBack", "redirectTo", "reLaunch", "switchTab")
    missing = [name for name in required if not re.search(rf"(?:mpx|wx)\.{name}\s*\(", source)]
    wrong_tab = re.search(
        r"(?:mpx|wx)\.navigateTo\s*\(\s*\{[^}]*url\s*:\s*['\"]/pages/orders/index",
        source,
        re.S,
    )
    if missing or wrong_tab:
        return False, f"outputs/{checkout_path}：路由 API 语义不完整或仍用 navigateTo 打开订单 tab；缺少 {missing}。"
    return True, f"outputs/{checkout_path}：五类 Mpx 官方路由 API 按普通页、返回、替换、重启与 tab 语义使用。"


def check_n3(root):
    path = "src/pages/checkout/index.mpx"
    source = read_output(root, path)
    navigator_tags = re.findall(r"<navigator\b[^>]*>", source, re.I | re.S)
    values = [
        value
        for tag in navigator_tags
        for value in re.findall(r"open-type\s*=\s*['\"]([^'\"]+)['\"]", tag)
    ]
    invalid_values = [value for value in values if value in ("navigateTo", "switchTab")]
    address_button = re.search(
        r"<button\b[^>]*\bbindtap\s*=\s*['\"]chooseAddress['\"][^>]*>",
        source,
        re.I | re.S,
    )
    if invalid_values:
        return False, f"outputs/{path}：navigator open-type 误用了 API 名或不稳定模板值：{invalid_values}。"
    if not address_button:
        return False, f"outputs/{path}：需要 EventChannel 的地址入口未使用 button 调用 chooseAddress。"
    return True, f"outputs/{path}：EventChannel 地址入口使用 button 脚本导航，其他 navigator 未使用 navigateTo/switchTab 错误值。"


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
    ref = re.search(
        r"(?<![\w:-])(?P<kind>wx:ref|ref@web|ref)\s*=\s*['\"](?P<name>[A-Za-z_$][\w$]*)['\"]",
        text,
    )
    imperative_refresh = False
    if ref:
        escaped = re.escape(ref.group("name"))
        ref_access = (
            rf"this\.\$refs(?:\.{escaped}\b|\[\s*['\"]{escaped}['\"]\s*\])"
        )
        image_load = re.search(
            r"<image\b[^>]*(?P<event>bindload(?:@web)?|@load(?:@web)?)\s*=\s*['\"](?P<handler>[A-Za-z_$][\w$]*)['\"]",
            source,
            re.I | re.S,
        )
        handler_body = (
            recursive_callable_context(source, image_load.group("handler"))
            if image_load
            else ""
        )
        alias = re.search(
            rf"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:this\.\$refs\s*&&\s*)?{ref_access}",
            handler_body,
        )
        refresh_call = re.search(rf"{ref_access}\s*\.refresh\s*\(", handler_body)
        if alias:
            refresh_call = refresh_call or re.search(
                rf"\b{re.escape(alias.group(1))}\.refresh\s*\(", handler_body
            )
        next_tick = re.search(r"(?:this\.)?\$?nextTick\s*\(", handler_body)
        web_guard = re.search(
            r"__mpx_mode__\s*(?:===|!==)\s*['\"]web['\"]", handler_body
        )
        web_event = image_load and image_load.group("event").lower().endswith("@web")
        capability_guard = re.search(
            r"typeof\s+[A-Za-z_$][\w$]*\.refresh\s*(?:===|!==)\s*['\"]function['\"]",
            handler_body,
        )
        missing_ref_guard = False
        if ref.group("kind") == "ref@web" and alias:
            name = re.escape(alias.group(1))
            missing_ref_guard = bool(
                re.search(rf"if\s*\(\s*{name}\s*\)", handler_body)
                or re.search(rf"\b{name}\?\.(?:refresh\??\.)?", handler_body)
            )
        isolated = web_event or web_guard or capability_guard or missing_ref_guard
        imperative_refresh = bool(refresh_call and next_tick and image_load and isolated)
    if not imperative_refresh:
        return False, f"outputs/{path}：图片尺寸晚到后缺少安全隔离的 image load + nextTick + scroll-view ref.refresh 刷新链路。"
    return True, f"outputs/{path}：图片 load 后经 Web 条件事件或脚本/能力判断安全调用 ref.refresh，覆盖固有尺寸晚到。"


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
    invalid_key = re.search(
        r"customBuiltInComponents\s*:\s*\{[\s\S]*?['\"]?mpx-scroll-view['\"]?\s*:",
        config,
    )
    default_slot = re.search(r"<slot\s*/?>", component, re.I)
    passthrough = default_slot and "$attrs" in component and "$listeners" in component
    if not valid_key or invalid_key or not passthrough:
        return False, f"outputs/{config_path} / outputs/{component_path}：原始 key 或 attrs/listeners/default slot 结构透传不完整。"
    return True, f"outputs/{config_path}：仅以 scroll-view 覆盖内建实现，并保留 attrs/listeners/default slot。"


def check_v7(root):
    path = "src/web/AnalyticsScroll.vue"
    source = read_output(root, path)
    props = ("scrollX", "scrollY", "scrollTop", "scrollLeft", "scrollIntoView")
    missing_props = [name for name in props if not re.search(rf"\b{name}\b", source)]
    axis_x = re.search(
        r"(?:overflowX[\s\S]{0,100}?scrollX|scrollX[\s\S]{0,100}?overflowX|analytics-scroll--x)",
        source,
        re.I,
    )
    axis_y = re.search(
        r"(?:overflowY[\s\S]{0,100}?scrollY|scrollY[\s\S]{0,100}?overflowY|analytics-scroll--y)",
        source,
        re.I,
    )
    top_watch = method_body(source, "scrollTop")
    left_watch = method_body(source, "scrollLeft")
    into_watch = method_body(source, "scrollIntoView")
    mounted = recursive_method_context(source, "mounted")
    direct_position = re.search(r"\.scrollTop\s*=", source) and re.search(r"\.scrollLeft\s*=", source)
    dynamic_position = re.search(r"\[[^\]]*(?:property|key)[^\]]*\]\s*=", source, re.I)
    initial_position = all(name in mounted for name in ("scrollTop", "scrollLeft"))
    into_behavior = (
        into_watch
        and re.search(r"(?:\$nextTick|nextTick)", into_watch)
        and re.search(r"\.scrollIntoView\s*\(", source)
        and re.search(r"(?:\.contains\s*\(|this\.\$refs|this\.\$el)", source)
        and re.search(r"(?:scrollIntoView|scrollToChild)", mounted)
    )
    if (
        missing_props
        or not axis_x
        or not axis_y
        or not top_watch
        or not left_watch
        or not (direct_position or dynamic_position)
        or not initial_position
        or not into_behavior
    ):
        return False, (
            f"outputs/{path}：横纵轴、受控位置或容器内 scrollIntoView 行为不完整；"
            f"缺少 props {missing_props}。"
        )
    return True, f"outputs/{path}：横纵 overflow、初始/更新位置与容器内 scrollIntoView 均有真实行为。"


def check_v8(root):
    path = "src/web/AnalyticsScroll.vue"
    source = read_output(root, path)
    body = method_body(source, "handleScroll")
    if not re.search(r"\$emit\s*\(\s*['\"]scroll['\"]", body):
        _, body = find_method(
            source,
            lambda candidate: bool(re.search(r"\$emit\s*\(\s*['\"]scroll['\"]", candidate)),
        )
    detail_fields = ("scrollTop", "scrollLeft", "scrollHeight", "scrollWidth", "deltaX", "deltaY")
    missing_detail = [name for name in detail_fields if name not in body]
    missing_events = [
        name for name in ("scroll", "scrolltoupper", "scrolltolower")
        if not re.search(rf"\$emit\s*\(\s*['\"]{name}['\"]", body)
    ]
    threshold_contract = all(name in source for name in ("upperThreshold", "lowerThreshold"))
    axis_bounds = all(name in body for name in ("clientHeight", "clientWidth", "scrollHeight", "scrollWidth"))
    directions = all(re.search(rf"['\"]{name}['\"]", body) for name in ("top", "left", "bottom", "right"))
    state_patterns = (
        r"(?:at|was|is|near)[A-Za-z_$]*Upper[A-Za-z_$]*X|(?:at|was|is|near)[A-Za-z_$]*X[A-Za-z_$]*Upper",
        r"(?:at|was|is|near)[A-Za-z_$]*Upper[A-Za-z_$]*Y|(?:at|was|is|near)[A-Za-z_$]*Y[A-Za-z_$]*Upper",
        r"(?:at|was|is|near)[A-Za-z_$]*Lower[A-Za-z_$]*X|(?:at|was|is|near)[A-Za-z_$]*X[A-Za-z_$]*Lower",
        r"(?:at|was|is|near)[A-Za-z_$]*Lower[A-Za-z_$]*Y|(?:at|was|is|near)[A-Za-z_$]*Y[A-Za-z_$]*Lower",
    )
    axis_states = all(re.search(rf"\b(?:{pattern})\b", source, re.I) for pattern in state_patterns)
    transition_guards = all(
        re.search(rf"!\s*this\.(?:{pattern})\b", body, re.I)
        for pattern in state_patterns
    )
    if (
        not body
        or missing_detail
        or missing_events
        or not threshold_contract
        or not axis_bounds
        or not directions
        or not axis_states
        or not transition_guards
    ):
        return False, (
            f"outputs/{path}：scroll detail、双轴边界方向或边界去重状态不完整；"
            f"缺少 detail {missing_detail}，缺少事件 {missing_events}。"
        )
    return True, f"outputs/{path}：scroll 详情完整，双轴 upper/lower 阈值按跨界状态发出四种方向。"


def check_v9(root):
    common_path = "src/components/analytics-panel.mpx"
    web_path = "src/components/analytics-panel.web.mpx"
    chart_path = "src/web/AnalyticsChart.vue"
    sdk_path = "src/web/chart-sdk.js"
    common = read_output(root, common_path)
    web = read_output(root, web_path)
    chart = read_output(root, chart_path)
    sdk = read_output(root, sdk_path)
    scroll = re.search(r"<scroll-view\b[^>]*>", web, re.I | re.S)
    scroll_text = scroll.group(0) if scroll else ""
    scroll_contract = (
        "scroll-x", "scroll-y", "scroll-top", "scroll-left", "scroll-into-view",
        "upper-threshold", "lower-threshold",
        "bindscroll", "bindscrolltoupper", "bindscrolltolower",
    )
    missing_scroll = [
        name for name in scroll_contract
        if not re.search(rf"\b{re.escape(name)}\s*=", scroll_text, re.I)
    ]
    common_click = (
        "metrics" in common
        and re.search(r"(?:bindtap|@tap)", common)
        and re.search(r"triggerEvent\s*\(\s*['\"]select['\"]", common)
    )
    web_relays = all(
        re.search(rf"triggerEvent\s*\(\s*['\"]{name}['\"]", web)
        for name in ("select", "scroll", "scrolltoupper", "scrolltolower")
    )
    chart_binding = re.search(r"<analytics-chart\b[^>]*(?:bindselect|@select)\s*=", web, re.I | re.S)
    chart_select = re.search(r"\$emit\s*\(\s*['\"]select['\"]", chart)
    sdk_select = re.search(r"(?:onSelect|data-metric-key|addEventListener\s*\(\s*['\"]click['\"])", sdk)
    chart_update = "metrics" in chart and re.search(r"\.update\s*\(", chart)
    if (
        missing_scroll
        or not common_click
        or not web_relays
        or not chart_binding
        or not chart_select
        or not sdk_select
        or not chart_update
    ):
        return False, (
            f"outputs/{common_path} / outputs/{web_path} / outputs/{chart_path}："
            f"滚动调用点或指标点击/更新回传链路不完整；缺少 {missing_scroll}。"
        )
    return True, "小程序指标点击、Web 图表更新/点击回传和完整滚动调用点均保留。"


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
    "v7": check_v7,
    "v8": check_v8,
    "v9": check_v9,
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


PUBLIC_GROUPS = ("mpx2web", "no_skill")
GROUP_LABELS = {
    "mpx2web": "使用 Skill",
    "no_skill": "无 Skill",
}


def run_number(path):
    return int(path.name.removeprefix("run-"))


def sha256_json(value):
    return hashlib.sha256(
        json.dumps(value, ensure_ascii=False, sort_keys=True).encode()
    ).hexdigest()


def extract_final_message(stdout):
    messages = []
    for line in stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        item = event.get("item", {})
        if event.get("type") == "item.completed" and item.get("type") == "agent_message":
            messages.append(item.get("text", ""))
    return messages[-1] if messages else ""


def parse_json_payload(text):
    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*", "", candidate)
        candidate = re.sub(r"\s*```$", "", candidate)
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("评分模型未返回 JSON 对象")
        return json.loads(candidate[start:end + 1])


def grader_fingerprint(item, run_root, grader_model, grader_reasoning_effort):
    run = json.loads((run_root / "run.json").read_text())
    return sha256_json({
        "candidate_fingerprint": run.get("fingerprint"),
        "grader_model": grader_model,
        "grader_reasoning_effort": grader_reasoning_effort,
        "assertions": item["assertions"],
        "checker_digest": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    })


def grading_complete(item, run_root, fingerprint):
    path = run_root / "grading.json"
    if not path.is_file():
        return False
    try:
        grade = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return False
    expected_ids = [assertion["id"] for assertion in item["assertions"]]
    actual_ids = [entry.get("id") for entry in grade.get("expectations", [])]
    return bool(
        grade.get("grading_fingerprint") == fingerprint
        and actual_ids == expected_ids
        and all(isinstance(entry.get("passed"), bool) for entry in grade["expectations"])
    )


def build_grader_prompt(item):
    assertions = "\n".join(
        f"- {assertion['id']}: {assertion['text']}"
        for assertion in item["assertions"]
    )
    return f"""你是独立验收模型。候选来自哪种配置已被隐藏；不要猜测或奖励其来源，只根据 input、outputs 和任务要求逐项判定。

任务：{item['prompt']}

待验收断言：
{assertions}

读取 ./input 与 ./outputs 中所有相关文件。每项只有 PASS/FAIL，不给部分分；证据不足即 FAIL。另请指出真正会造成结论偏差的断言缺口，不做无关挑刺。

只返回一个 JSON 对象，不要 Markdown，不要写工作目录外文件。格式：
{{
  "expectations": [
    {{"id": "断言 id", "passed": true, "evidence": "具体文件与代码证据"}}
  ],
  "claims": [],
  "eval_feedback": {{"suggestions": [], "overall": "简短评价"}}
}}
必须且只能覆盖上面全部断言 id，顺序保持一致。"""


def build_grader_command(model, reasoning_effort, workdir, codex_bin="codex"):
    return [
        codex_bin,
        "exec",
        "--ignore-user-config",
        "--ephemeral",
        "--disable",
        "plugins",
        "--disable",
        "remote_plugin",
        "--disable",
        "apps",
        "--skip-git-repo-check",
        "-C",
        str(workdir),
        "-s",
        "workspace-write",
        "-m",
        model,
        "-c",
        f'model_reasoning_effort="{reasoning_effort}"',
        "--color",
        "never",
        "--json",
        "-",
    ]


def normalize_model_grade(item, payload):
    raw = payload.get("expectations", [])
    by_id = {entry.get("id"): entry for entry in raw if entry.get("id")}
    expectations = []
    for assertion in item["assertions"]:
        entry = by_id.get(assertion["id"], {})
        passed = entry.get("passed") is True
        evidence = entry.get("evidence") or "独立评分未提供该断言的可核验证据。"
        expectations.append({
            "id": assertion["id"],
            "text": assertion["text"],
            "passed": passed,
            "evidence": evidence,
            "verification_methods": ["independent_code_review"],
        })
    return expectations


def compile_failure_evidence(run_root):
    compile_path = Path(run_root) / "compile.json"
    if not compile_path.is_file():
        return "候选未通过编译/语义门禁，且缺少 compile.json 诊断。"
    compile_result = json.loads(compile_path.read_text())
    failures = []
    for check in compile_result.get("checks", []):
        if check.get("passed") is not False:
            continue
        kind = check.get("kind", "unknown-gate")
        details = []
        for file_result in check.get("detail", {}).get("files", []):
            for error in file_result.get("errors", []):
                details.append(
                    f"{Path(file_result.get('file', '')).name}:{error.get('line', 0)} "
                    f"{error.get('message', '')}"
                )
        failures.append(f"{kind}: {'; '.join(details[:3]) or '检查未通过'}")
    suffix = "；".join(failures[:3]) or "至少一项编译/语义检查未通过"
    return f"候选未通过硬门禁，按不可交付结果计 0 分：{suffix}"


def grade_compile_failure(item, group, run_root, grader_model, grader_reasoning_effort):
    fingerprint = grader_fingerprint(
        item, run_root, grader_model, grader_reasoning_effort
    )
    evidence = compile_failure_evidence(run_root)
    expectations = [{
        "id": assertion["id"],
        "text": assertion["text"],
        "passed": False,
        "evidence": evidence,
        "verification_methods": ["compile_gate"],
    } for assertion in item["assertions"]]
    metrics_path = run_root / "metrics.json"
    timing_path = run_root / "timing.json"
    compile_path = run_root / "compile.json"
    grade = {
        "eval_id": item["id"],
        "eval_name": item["name"],
        "configuration": group,
        "run_number": run_number(run_root),
        "grading_fingerprint": fingerprint,
        "grader": {
            "model": grader_model,
            "reasoning_effort": grader_reasoning_effort,
            "blind_configuration": True,
            "duration_ms": 0,
            "invoked": False,
            "skip_reason": "compile_or_semantic_gate_failed",
        },
        "expectations": expectations,
        "summary": {
            "passed": 0,
            "failed": len(expectations),
            "total": len(expectations),
            "pass_rate": 0.0,
        },
        "metrics": json.loads(metrics_path.read_text()) if metrics_path.is_file() else {},
        "timing": json.loads(timing_path.read_text()) if timing_path.is_file() else {},
        "compile": json.loads(compile_path.read_text()) if compile_path.is_file() else {},
        "claims": [],
        "eval_feedback": {
            "suggestions": ["先修复编译或条件编译语义错误，再进行功能评分。"],
            "overall": evidence,
        },
    }
    (run_root / "grading.json").write_text(
        json.dumps(grade, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        f"[gate-failed] eval-{item['id']} {group} {run_root.name} "
        f"0/{len(expectations)}",
        flush=True,
    )
    return grade


def grade_run(item, group, run_root, grader_model, grader_reasoning_effort, codex_bin="codex"):
    run = json.loads((run_root / "run.json").read_text())
    if run.get("returncode") != 0 or run.get("outputs_complete") is not True:
        raise ValueError(f"候选生成未完成：{run_root}")
    if run.get("compile_status") != "passed":
        return grade_compile_failure(
            item, group, run_root, grader_model, grader_reasoning_effort
        )
    fingerprint = grader_fingerprint(
        item, run_root, grader_model, grader_reasoning_effort
    )
    print(
        f"[grading] eval-{item['id']} {group} {run_root.name}", flush=True
    )
    started = time.monotonic()
    with tempfile.TemporaryDirectory(prefix="mpx2web-grader-") as directory:
        neutral_root = Path(directory).resolve()
        eval_root = run_root.parents[1]
        shutil.copytree(eval_root / "input", neutral_root / "input")
        shutil.copytree(run_root / "outputs", neutral_root / "outputs")
        command = build_grader_command(
            grader_model, grader_reasoning_effort, neutral_root, codex_bin
        )
        result = subprocess.run(
            command,
            cwd=neutral_root,
            input=build_grader_prompt(item),
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"独立评分失败 {run_root}: {result.stderr[-2000:]}"
            )
        generated_path = neutral_root / "grading.json"
        payload = (
            json.loads(generated_path.read_text())
            if generated_path.is_file()
            else parse_json_payload(extract_final_message(result.stdout))
        )
    duration_ms = round((time.monotonic() - started) * 1000)
    expectations = normalize_model_grade(item, payload)
    expectations = apply_deterministic_checks(item, expectations, run_root)
    passed = sum(entry["passed"] is True for entry in expectations)
    metrics_path = run_root / "metrics.json"
    timing_path = run_root / "timing.json"
    compile_path = run_root / "compile.json"
    grade = {
        "eval_id": item["id"],
        "eval_name": item["name"],
        "configuration": group,
        "run_number": run_number(run_root),
        "grading_fingerprint": fingerprint,
        "grader": {
            "model": grader_model,
            "reasoning_effort": grader_reasoning_effort,
            "blind_configuration": True,
            "duration_ms": duration_ms,
        },
        "expectations": expectations,
        "summary": {
            "passed": passed,
            "failed": len(expectations) - passed,
            "total": len(expectations),
            "pass_rate": round(passed / len(expectations), 4),
        },
        "metrics": json.loads(metrics_path.read_text()) if metrics_path.is_file() else {},
        "timing": json.loads(timing_path.read_text()) if timing_path.is_file() else {},
        "compile": json.loads(compile_path.read_text()) if compile_path.is_file() else {},
        "claims": payload.get("claims", []),
        "eval_feedback": payload.get("eval_feedback", {}),
    }
    (run_root / "grading.json").write_text(
        json.dumps(grade, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        f"[graded] eval-{item['id']} {group} {run_root.name} "
        f"{passed}/{len(expectations)}",
        flush=True,
    )
    return grade


def collect_grade_jobs(root, samples):
    public = json.loads((root / "evals.json").read_text())
    jobs = []
    for item in public["evals"]:
        eval_root = root / f"eval-{item['id']}-{item['name']}"
        for group in PUBLIC_GROUPS:
            for sample in range(1, samples + 1):
                run_root = eval_root / group / f"run-{sample}"
                if not (run_root / "run.json").is_file():
                    raise ValueError(f"缺少生成结果：{run_root / 'run.json'}")
                jobs.append((item, group, run_root))
    return jobs


def run_independent_grading(root, samples, grader_model, grader_reasoning_effort, jobs=2, resume=False, codex_bin="codex"):
    grade_jobs = []
    for item, group, run_root in collect_grade_jobs(root, samples):
        fingerprint = grader_fingerprint(
            item, run_root, grader_model, grader_reasoning_effort
        )
        if resume and grading_complete(item, run_root, fingerprint):
            print(f"[skip-grade] eval-{item['id']} {group} {run_root.name}", flush=True)
            continue
        grade_jobs.append((item, group, run_root))
    if not grade_jobs:
        return []
    with ThreadPoolExecutor(max_workers=min(jobs, len(grade_jobs))) as executor:
        futures = [
            executor.submit(
                grade_run,
                item,
                group,
                run_root,
                grader_model,
                grader_reasoning_effort,
                codex_bin,
            )
            for item, group, run_root in grade_jobs
        ]
        return [future.result() for future in futures]


def output_stats(output_root):
    files = [path for path in output_root.rglob("*") if path.is_file()]
    lines = 0
    nonempty = 0
    size = 0
    for path in files:
        data = path.read_bytes()
        size += len(data)
        try:
            text = data.decode()
        except UnicodeDecodeError:
            continue
        split = text.splitlines()
        lines += len(split)
        nonempty += sum(bool(line.strip()) for line in split)
    return {
        "output_files": len(files),
        "output_lines": lines,
        "output_nonempty_lines": nonempty,
        "output_bytes": size,
    }


def audit_workspace(root, write_grades=False, samples=None):
    public = json.loads((root / "evals.json").read_text())
    results = []
    totals = {}
    for item in public["evals"]:
        eval_root = root / f"eval-{item['id']}-{item['name']}"
        for group in PUBLIC_GROUPS:
            run_dirs = sorted((
                path for path in (eval_root / group).glob("run-*")
                if path.is_dir() and path.name.removeprefix("run-").isdigit()
                and (samples is None or 1 <= run_number(path) <= samples)
            ), key=run_number)
            if samples is not None and [run_number(path) for path in run_dirs] != list(range(1, samples + 1)):
                raise ValueError(f"{eval_root / group} 缺少 1..{samples} 完整采样")
            for run_root in run_dirs:
                grade_path = run_root / "grading.json"
                if not grade_path.is_file():
                    raise ValueError(f"缺少独立评分：{grade_path}")
                grade = json.loads(grade_path.read_text())
                if samples is not None:
                    grader = grade.get("grader", {})
                    expected_fingerprint = grader_fingerprint(
                        item,
                        run_root,
                        grader.get("model", ""),
                        grader.get("reasoning_effort", ""),
                    )
                    if grade.get("grading_fingerprint") != expected_fingerprint:
                        raise ValueError(f"评分已过期，必须重新独立评分：{grade_path}")
                expectations = grade["expectations"]
                by_id = {entry["id"]: entry for entry in expectations}
                for assertion in item["assertions"]:
                    expectation = by_id.get(assertion["id"])
                    if expectation is None:
                        expectation = {
                            "id": assertion["id"],
                            "text": assertion["text"],
                            "passed": None,
                            "evidence": "旧评分未包含该新增断言，等待确定性复核或重新评分。",
                            "verification_methods": ["deterministic_check"],
                        }
                        expectations.append(expectation)
                        by_id[assertion["id"]] = expectation
                    expectation["text"] = assertion["text"]
                    expectation.setdefault(
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
                metrics_path = run_root / "metrics.json"
                metrics = json.loads(metrics_path.read_text()) if metrics_path.is_file() else {}
                compile_path = run_root / "compile.json"
                compile_result = json.loads(compile_path.read_text()) if compile_path.is_file() else {}
                results.append({
                    "eval_id": item["id"],
                    "eval_name": item["name"],
                    "configuration": group,
                    "run_number": run_number(run_root),
                    **audited["summary"],
                    **timing,
                    **metrics,
                    **output_stats(run_root / "outputs"),
                    "compile_status": compile_result.get("status"),
                    "compiled_mpx_count": compile_result.get("compiled_mpx_count", 0),
                    "compile_eligible_mpx_count": compile_result.get("compile_eligible_mpx_count", 0),
                    "all_declared_outputs_present": compile_result.get("all_declared_outputs_present", False),
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


def aggregate_benchmark(root, samples):
    payload = audit_workspace(root, write_grades=False, samples=samples)
    public = json.loads((root / "evals.json").read_text())
    rows = payload["results"]
    summaries = {}
    for group in PUBLIC_GROUPS:
        group_rows = [row for row in rows if row["configuration"] == group]
        sample_rates = []
        for sample in range(1, samples + 1):
            sample_rows = [row for row in group_rows if row["run_number"] == sample]
            passed = sum(row["passed"] for row in sample_rows)
            total = sum(row["total"] for row in sample_rows)
            sample_rates.append(round(passed / total, 4))
        assertion_outcomes = {}
        for row in group_rows:
            for entry in row["expectations"]:
                assertion_outcomes.setdefault(
                    (row["eval_id"], entry["id"]), []
                ).append(entry["passed"])
        stable_pass = sum(all(values) for values in assertion_outcomes.values())
        stable_fail = sum(not any(values) for values in assertion_outcomes.values())
        variable = len(assertion_outcomes) - stable_pass - stable_fail
        summaries[group] = {
            **payload["totals"][group],
            "label": GROUP_LABELS[group],
            "sample_pass_rates": sample_rates,
            "sample_mean": round(statistics.mean(sample_rates), 4),
            "sample_stddev": round(statistics.pstdev(sample_rates), 4),
            "sample_min": min(sample_rates),
            "sample_max": max(sample_rates),
            "stability": {
                "stable_pass": stable_pass,
                "stable_fail": stable_fail,
                "variable": variable,
            },
            "compile": {
                "status": "passed" if all(row["compile_status"] == "passed" for row in group_rows) else "failed",
                "compiled_mpx": sum(row["compiled_mpx_count"] for row in group_rows),
                "eligible_mpx": sum(row["compile_eligible_mpx_count"] for row in group_rows),
                "declared_outputs_complete": all(row["all_declared_outputs_present"] for row in group_rows),
            },
            "efficiency": {
                "total_tokens": sum(row.get("total_tokens", 0) for row in group_rows),
                "duration_seconds": round(sum(row.get("duration_ms", 0) for row in group_rows) / 1000, 3),
                "tool_calls": sum(row.get("tool_calls", 0) for row in group_rows),
                "output_lines": sum(row.get("output_lines", 0) for row in group_rows),
                "output_bytes": sum(row.get("output_bytes", 0) for row in group_rows),
            },
        }
    deltas = {
        "mpx2web_vs_no_skill": round(
            summaries["mpx2web"]["sample_mean"] - summaries["no_skill"]["sample_mean"], 4
        ),
    }
    benchmark = {
        "metadata": {
            "skill_name": public["skill_name"],
            "iteration": public["iteration"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "samples_per_configuration": samples,
            "configurations": GROUP_LABELS,
            "grading_mode": "blind independent model review plus frozen deterministic overrides",
            "compile_boundary": (
                "All compile-eligible Mpx page/component outputs are built for Web; "
                "app.mpx and non-Mpx support artifacts are reported separately."
            ),
        },
        "runs": rows,
        "run_summary": summaries,
        "deltas": deltas,
        "notes": [
            "Pass rate is assertion-weighted; each sample also receives an independent aggregate rate.",
            "Three samples estimate stochastic variance but do not prove behavior outside the 13 frozen scenarios.",
        ],
    }
    (root / "benchmark.json").write_text(
        json.dumps(benchmark, ensure_ascii=False, indent=2) + "\n"
    )
    lines = [
        "# Mpx2Web iteration-11 reliability benchmark",
        "",
        f"- 采样：每组 {samples} 次，共 {len(rows)} 个候选结果",
        "- 评分：隐藏配置标签的独立模型评审 + 冻结确定性检查器覆盖",
        "- 编译：所有可作为 page/component 入口的 `.mpx` 均执行真实 Web 编译",
        "",
        "| 配置 | 加权通过率 | 三轮通过率 | 均值 ± 标准差 | 稳定通过/波动/稳定失败 | 编译 |",
        "| --- | ---: | --- | ---: | ---: | --- |",
    ]
    for group in PUBLIC_GROUPS:
        summary = summaries[group]
        stability = summary["stability"]
        rates = ", ".join(f"{rate:.1%}" for rate in summary["sample_pass_rates"])
        compile_summary = summary["compile"]
        lines.append(
            f"| {summary['label']} | {summary['pass_rate']:.1%} | {rates} | "
            f"{summary['sample_mean']:.1%} ± {summary['sample_stddev']:.1%} | "
            f"{stability['stable_pass']}/{stability['variable']}/{stability['stable_fail']} | "
            f"{compile_summary['compiled_mpx']}/{compile_summary['eligible_mpx']} |"
        )
    lines.extend([
        "",
        "## 差异",
        "",
        f"- 使用 Skill 相对无 Skill：{deltas['mpx2web_vs_no_skill']:+.1%}",
        "",
        "## 结论边界",
        "",
        "该结论只覆盖冻结的 13 个场景和当前三次采样。`app.mpx`、HTML 与配置文件不是 compile-validate 支持的独立入口，不会被伪报为独立编译；它们的完整性和可解析性在各 run 的 `compile.json` 中单独记录。",
        "",
    ])
    (root / "benchmark.md").write_text("\n".join(lines))
    review_rows = []
    for row in rows:
        expectations = "".join(
            f"<li class='{'pass' if entry['passed'] else 'fail'}'>"
            f"<strong>{html.escape(entry['id'])}</strong> "
            f"{html.escape(entry.get('text', ''))}<br>"
            f"<small>{html.escape(entry.get('evidence', ''))}</small></li>"
            for entry in row["expectations"]
        )
        review_rows.append(
            f"<details><summary>eval-{row['eval_id']} · "
            f"{html.escape(GROUP_LABELS[row['configuration']])} · run-{row['run_number']} · "
            f"{row['passed']}/{row['total']}</summary><ul>{expectations}</ul></details>"
        )
    summary_rows = "".join(
        f"<tr><td>{html.escape(summaries[group]['label'])}</td>"
        f"<td>{summaries[group]['pass_rate']:.1%}</td>"
        f"<td>{summaries[group]['sample_mean']:.1%} ± {summaries[group]['sample_stddev']:.1%}</td>"
        f"<td>{summaries[group]['compile']['compiled_mpx']}/{summaries[group]['compile']['eligible_mpx']}</td></tr>"
        for group in PUBLIC_GROUPS
    )
    review = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mpx2Web iteration-11 review</title>
<style>body{{font:14px/1.55 system-ui,sans-serif;max-width:1180px;margin:32px auto;padding:0 20px;color:#222}}table{{border-collapse:collapse;width:100%}}th,td{{border:1px solid #ddd;padding:8px;text-align:left}}details{{border:1px solid #ddd;border-radius:6px;margin:8px 0;padding:8px}}.pass{{color:#176b2c}}.fail{{color:#a21d1d}}small{{color:#555}}</style></head>
<body><h1>Mpx2Web iteration-11 reliability review</h1>
<p>独立盲评 + 确定性覆盖；每组 {samples} 次采样。编译边界详见 benchmark.md。</p>
<table><thead><tr><th>配置</th><th>加权通过率</th><th>三轮均值 ± 标准差</th><th>Web 编译</th></tr></thead><tbody>{summary_rows}</tbody></table>
<h2>逐项证据</h2>{''.join(review_rows)}</body></html>"""
    (root / "review.html").write_text(review)
    return benchmark


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
    parser.add_argument("--independent-grade", action="store_true")
    parser.add_argument("--grader-model", default="gpt-5.5")
    parser.add_argument("--grader-reasoning-effort", default="high")
    parser.add_argument("--samples", type=int, default=3)
    parser.add_argument("--jobs", type=int, default=2)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--codex-bin", default="codex")
    parser.add_argument("--aggregate", action="store_true")
    parser.add_argument(
        "--output",
        type=Path,
        help="将审计 JSON 写入指定文件；省略时输出到 stdout",
    )
    args = parser.parse_args()
    root = args.workspace.resolve()
    if args.samples < 1 or args.jobs < 1:
        parser.error("--samples and --jobs must be at least 1")
    if args.independent_grade:
        run_independent_grading(
            root,
            args.samples,
            args.grader_model,
            args.grader_reasoning_effort,
            jobs=args.jobs,
            resume=args.resume,
            codex_bin=args.codex_bin,
        )
    if args.aggregate:
        payload = aggregate_benchmark(root, args.samples)
    else:
        payload = audit_workspace(root, args.write_grades, samples=args.samples if args.independent_grade else None)
    if args.summary:
        summary_payload = payload.get("totals") or payload.get("run_summary")
        rendered = json.dumps(summary_payload, ensure_ascii=False, indent=2) + "\n"
    else:
        rendered = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered)
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
