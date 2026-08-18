#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent


def has(text, pattern):
    return re.search(pattern, text, re.I | re.S) is not None


def lacks(text, pattern):
    return not has(text, pattern)


def isolated(text):
    return has(text, r"__mpx_mode__\s*[!=]==?\s*['\"]web['\"]|@(?:_|)web\b|@mpx-if[^\n]*web")


def uses_api(text, api):
    return has(text, rf"\bmpx\.{api}\b|import\s*\{{[^}}]*\b{api}\b[^}}]*\}}\s*from\s*['\"]@mpxjs/api-proxy['\"]")


def web_style_blocks(text):
    return "\n".join(re.findall(
        r"/\*\s*@mpx-if\s*\(\s*__mpx_mode__\s*===\s*['\"]web['\"]\s*\)\s*\*/([\s\S]*?)/\*\s*@mpx-endif\s*\*/",
        text,
        re.I
    ))


def output_file(text, name):
    match = re.search(
        rf"/\* OUTPUT_FILE:{re.escape(name)} \*/\n([\s\S]*?)(?=\n/\* OUTPUT_FILE:|\Z)",
        text
    )
    return match.group(1) if match else text


def before_factory_call(text, factory):
    match = re.search(rf"\b{factory}\s*\(\s*\{{", text)
    return text[:match.start()] if match else text


def method_has_todo(text, name):
    return has(
        text,
        rf"\b{name}\s*\([^)]*\)\s*\{{[\s\S]{{0,320}}(?:TODO|待接入|业务实现|Bridge|SDK)"
    )


def ssr_browser_objects_safe(text):
    page = output_file(text, "product-detail.mpx")
    page_prefix = before_factory_call(page, "createPage")
    return guarded_browser_objects(page_prefix) and all(
        guarded_browser_objects(body) for body in ssr_server_prefetch_bodies(page)
    )


def guarded_browser_objects(text):
    for match in re.finditer(r"\b(window|document|navigator)\s*[.[]", text):
        name = match.group(1)
        prefix = text[max(0, match.start() - 320):match.start()]
        if not has(prefix, rf"typeof\s+{name}\s*[!=]==?\s*['\"]undefined['\"]"):
            return False
    return True


def ssr_pinia_per_request(text):
    app = output_file(text, "app.mpx")
    hook = re.search(r"onAppInit\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*}", app)
    if not hook:
        hook = re.search(r"onAppInit\s*=\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*}", app)
    return bool(
        hook
        and has(hook.group(1), r"createPinia\s*\(")
        and has(hook.group(1), r"return\s*\{[\s\S]*pinia")
        and lacks(before_factory_call(app, "createApp"), r"\b(?:const|let|var)\s+pinia\s*=\s*createPinia\s*\(")
    )


def ssr_request_server_safe(text):
    page = output_file(text, "product-detail.mpx")
    return all(lacks(body, r"\bwx\.request\b") for body in ssr_server_prefetch_bodies(page)) and (
        uses_api(page, "request")
        or has(page, r"\baxios\s*\(")
        or has(page, r"\bfetch\s*\(")
        or has(page, r"import\s+(?:\w+|\{[^}]+\})\s+from\s+['\"][^'\"]*(?:service|api|request|http)[^'\"]*['\"]")
    )


def web_touch_handlers_isolated(text):
    web_templates = re.findall(r"<template\b[^>]*\bmode\s*=\s*['\"]web['\"][^>]*>([\s\S]*?)</template>", text, re.I)
    if web_templates:
        return all(lacks(block, r"(?:catch|bind)touch(?:start|move|end|cancel)\s*=\s*['\"]\{\{\s*gesture\.") for block in web_templates)
    return lacks(text, r"(?:catch|bind)touch(?:start|move|end|cancel)(?:@web)?\s*=\s*['\"]\{\{\s*gesture\.")


def ordinary_script(text):
    source = re.sub(r"<script\b[^>]*\blang\s*=\s*['\"]wxs['\"][^>]*>[\s\S]*?</script>", "", text, flags=re.I)
    return "\n".join(re.findall(r"<script\b(?![^>]*\btype\s*=)[^>]*>([\s\S]*?)</script>", source, re.I))


def mask_js_non_code(text):
    chars = list(text)
    i = 0
    quote = None
    while i < len(chars):
        if quote:
            if chars[i] == "\\":
                chars[i] = " "
                if i + 1 < len(chars):
                    chars[i + 1] = " "
                i += 2
                continue
            current = chars[i]
            chars[i] = " "
            if current == quote:
                quote = None
            i += 1
            continue
        if chars[i] in ("'", '"', "`"):
            quote = chars[i]
            chars[i] = " "
            i += 1
            continue
        if chars[i:i + 2] == ["/", "/"]:
            end = text.find("\n", i + 2)
            end = len(chars) if end < 0 else end
            chars[i:end] = " " * (end - i)
            i = end
            continue
        if chars[i:i + 2] == ["/", "*"]:
            end = text.find("*/", i + 2)
            end = len(chars) - 2 if end < 0 else end
            chars[i:end + 2] = " " * (end + 2 - i)
            i = end + 2
            continue
        i += 1
    return "".join(chars)


def js_braced_bodies(text, header_pattern):
    script = ordinary_script(text) or text
    masked = mask_js_non_code(script)
    bodies = []
    for match in re.finditer(rf"(?:{header_pattern})\s*\{{", masked, re.I):
        start = match.end() - 1
        end = js_matching_delimiter(masked, start, "{", "}")
        if end is not None:
            bodies.append(script[start + 1:end])
    return bodies


def js_matching_delimiter(text, start, opening, closing):
    depth = 1
    for index in range(start + 1, len(text)):
        if text[index] == opening:
            depth += 1
        elif text[index] == closing:
            depth -= 1
            if depth == 0:
                return index
    return None


def js_named_function_bodies(text, name_pattern):
    name = rf"(?:{name_pattern})"
    owner = r"(?:[A-Za-z_$][\w$]*\s*\.\s*)*"
    header = (
        rf"(?:\b(?:async\s+)?{name}\s*\([^)]*\)"
        rf"|\b{owner}{name}\s*=\s*(?:async\s+)?function\s*\([^)]*\)"
        rf"|\b{name}\s*:\s*(?:async\s+)?function\s*\([^)]*\))"
    )
    return js_braced_bodies(text, header)


def js_return_expressions(text):
    masked = mask_js_non_code(text)
    expressions = []
    for match in re.finditer(r"\breturn\b", masked):
        start = match.end()
        while start < len(masked) and masked[start] in " \t":
            start += 1
        if start == len(masked) or masked[start] in "\r\n;}":
            continue
        depths = {"(": 0, "[": 0, "{": 0}
        pairs = {")": "(", "]": "[", "}": "{"}
        end = start
        while end < len(masked):
            char = masked[end]
            if char in depths:
                depths[char] += 1
            elif char in pairs:
                opening = pairs[char]
                if depths[opening] == 0:
                    break
                depths[opening] -= 1
            if not any(depths.values()) and (char == ";" or char in "\r\n"):
                break
            end += 1
        expressions.append(text[start:end].strip())
    return expressions


def js_has_data_load_call(text):
    masked = mask_js_non_code(text)
    calls = re.findall(r"\b[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*\s*(?=\()", masked)
    return any(re.search(r"(?:load|fetch|request)", call, re.I) for call in calls)


def js_has_top_level_return(text):
    masked = mask_js_non_code(text)
    depth = 0
    cursor = 0
    for match in re.finditer(r"\breturn\b", masked):
        for char in masked[cursor:match.start()]:
            if char == "{":
                depth += 1
            elif char == "}":
                depth = max(0, depth - 1)
        if depth == 0:
            return True
        cursor = match.end()
    return False


def js_if_branches(text):
    masked = mask_js_non_code(text)
    branches = []
    for match in re.finditer(r"\bif\s*\(", masked):
        condition_start = masked.find("(", match.start())
        condition_end = js_matching_delimiter(masked, condition_start, "(", ")")
        if condition_end is None:
            continue
        branch_start = condition_end + 1
        while branch_start < len(masked) and masked[branch_start].isspace():
            branch_start += 1
        if branch_start >= len(masked):
            continue
        if masked[branch_start] == "{":
            branch_end = js_matching_delimiter(masked, branch_start, "{", "}")
            if branch_end is None:
                continue
            consequent = text[branch_start + 1:branch_end]
            statement_end = branch_end + 1
        else:
            statement_end = branch_start
            while statement_end < len(masked) and masked[statement_end] not in ";\r\n":
                statement_end += 1
            consequent = text[branch_start:statement_end]
            if statement_end < len(masked) and masked[statement_end] == ";":
                statement_end += 1
        branches.append((text[condition_start + 1:condition_end], consequent, statement_end))
    return branches


def has_identity_comparison(text):
    masked = mask_js_non_code(text)
    expression = r"[A-Za-z_$][\w$]*(?:\s*(?:\?\.|\.)\s*[A-Za-z_$][\w$]*)*"
    for match in re.finditer(rf"({expression})\s*={2,3}\s*({expression})", masked):
        sides = match.groups()
        if all(any(re.search(r"(?:id|key|slug)$", name, re.I) for name in re.findall(r"[A-Za-z_$][\w$]*", side)) for side in sides):
            return True
    return False


def has_module_scope_gesture_state(text):
    script = ordinary_script(text)
    masked = mask_js_non_code(script)
    depth = 0
    cursor = 0
    for match in re.finditer(r"\b(?:let|var)\s+([A-Za-z_$][\w$]*)", masked):
        for char in masked[cursor:match.start()]:
            if char == "{":
                depth += 1
            elif char == "}":
                depth = max(0, depth - 1)
        cursor = match.start()
        if depth == 0 and re.search(r"start|offset|moved|swipe|gesture", match.group(1), re.I):
            return True
    return False


def js_method_bodies(text, name_pattern):
    return js_braced_bodies(text, rf"\b(?:{name_pattern})\s*\([^)]*\)")


def web_touch_cancel_safe(text):
    bodies = js_method_bodies(text, r"(?:on|handle)\w*TouchCancel")
    for body in bodies:
        if has(body, r"(?:finish|end)\w*Swipe\s*\(\s*false\s*\)"):
            return True
        if has(body, r"cancel\w*Swipe\s*\("):
            return True
        if has(body, r"(?:offsetX|offset)\s*[:=]\s*0") and has(body, r"open\s*:\s*false"):
            return True
    return False


def socket_callbacks_guard_current_task(text):
    callbacks = re.findall(r"\.on(?:Open|Message|Error|Close)\s*\([^=]*=>\s*\{([\s\S]*?)\}\s*\)", text)
    guarded = [body for body in callbacks if (
        has(body, r"if\s*\([^)]*this\.\w*(?:socket|task)\w*\s*!={1,2}\s*\w*(?:socket|task)\w*[^)]*\)\s*return")
        or has(body, r"if\s*\([^)]*this\.\w*(?:socket|task)\w*\s*===?\s*\w*(?:socket|task)\w*[^)]*\)\s*\{")
    )]
    return len(callbacks) >= 4 and len(guarded) == len(callbacks)


def socket_replacement_safe(text):
    return has(
        text,
        r"(?:reconnect|connectRoom|connect)\s*\([^)]*\)\s*\{[\s\S]{0,700}(?:this\.\w*(?:socket|task)\w*\s*=\s*null[\s\S]{0,180}\.close\s*\(|\.close\s*\([\s\S]{0,180}this\.\w*(?:socket|task)\w*\s*=\s*(?:null|\w+))"
    )


def socket_detach_cleanup_bodies(text):
    detached_bodies = js_method_bodies(text, "detached")
    cleanup_bodies = list(detached_bodies)
    for detached_body in detached_bodies:
        calls = re.findall(r"\bthis\.([A-Za-z_$][\w$]*)\s*\(", mask_js_non_code(detached_body))
        for name in calls:
            cleanup_bodies.extend(js_method_bodies(text, re.escape(name)))
    return cleanup_bodies


def socket_body_invalidates_before_close(body):
    invalidated = re.search(r"(?:disposed|destroyed)\s*=\s*true|this\.\w*(?:socket|task)\w*\s*=\s*null", body)
    closed = re.search(r"\.close\s*\(", body)
    return bool(invalidated and closed and invalidated.start() < closed.start())


def socket_detach_closes_task(text):
    return any(has(body, r"\.close\s*\(") for body in socket_detach_cleanup_bodies(text))


def socket_detach_invalidates_before_close(text):
    return any(socket_body_invalidates_before_close(body) for body in socket_detach_cleanup_bodies(text))


def socket_send_current_open_task(text):
    method = re.search(r"sendMessage\s*\([^)]*\)\s*\{([\s\S]{0,700}?)\n\s*}", text)
    if not method:
        return False
    body = method.group(1)
    has_task = has(body, r"(?:const|let)\s+(\w*(?:socket|task)\w*)\s*=\s*this\.\w*(?:socket|task)\w*|this\.\w*(?:socket|task)\w*")
    open_check = has(body, r"\.readyState\s*===?\s*(?:\w*(?:socket|task)\w*\.)?OPEN\b|\bconnected\b")
    return has_task and open_check and has(body, r"\.send\s*\(")


def ssr_hydration_reuse_by_id(text):
    page = output_file(text, "product-detail.mpx")
    has_identity = has(page, r"\b(?:productId|loadedProductId|hydratedProductId)\b")
    compares_identity = has(page, r"(?:productId|loadedProductId|hydratedProductId)[\s\S]{0,100}(?:===|==)[\s\S]{0,100}(?:\bid\b|query\.id|route|productId)")
    skips_fetch = has(page, r"if\s*\([^)]*(?:productId|loadedProductId|hydratedProductId)[^)]*\)\s*(?:\{[\s\S]{0,160}?return|return)")
    return has_identity and compares_identity and skips_fetch


RUBRICS = {
    "eval-0-small-font": [
        ("保留小程序原始 10px 字号", lambda t: has(t, r"font-size\s*:\s*10px")),
        ("Web 使用较大基础字号配合 scale 还原视觉字号", lambda t: has(web_style_blocks(t), r"font-size\s*:\s*(?:1[2-9]|[2-9]\d)px") and has(web_style_blocks(t), r"transform\s*:\s*scale\s*\(\s*(?:0)?\.[1-8]")),
        ("Web 缩放设置明确 transform-origin", lambda t: has(web_style_blocks(t), r"transform-origin\s*:\s*(?:(?:left|right|center)\s+(?:top|center|bottom)|(?:top|center|bottom)|0%|0\s)")),
        ("缩放后校正布局占位", lambda t: has(web_style_blocks(t), r"(?:width|margin(?:-left|-right)?|translateX)\s*:\s*[^;]+")),
        ("小字号补偿使用正确 Web 条件隔离", lambda t: bool(web_style_blocks(t))),
    ],
    "eval-1-style-isolation": [
        ("Web 组件样式使用 scoped 隔离", lambda t: has(output_file(t, "profile-card.mpx"), r"<style\b[^>]*\bscoped\b")),
        ("基础标签节点增加稳定业务类名", lambda t: has(output_file(t, "profile-card.mpx"), r"<image\b[^>]*class\s*=\s*['\"][^'\"]+['\"]")),
        ("组件样式不再依赖 image 标签选择器", lambda t: lacks(output_file(t, "profile-card.mpx"), r"\.card\s+image\b")),
        ("保留父页面和组件各自的标题视觉", lambda t: has(t, r"\.title\s*\{[^}]*color\s*:\s*#d33[^}]*font-size\s*:\s*40rpx") and has(t, r"\.title\s*\{[^}]*color\s*:\s*#333[^}]*font-size\s*:\s*30rpx")),
        ("组件头像继续保持圆形且无父页面红色边框", lambda t: has(output_file(t, "profile-card.mpx"), r"\.(?:avatar|profile-avatar)\s*\{[^}]*border-radius\s*:\s*50%") and lacks(output_file(t, "profile-card.mpx"), r"\.(?:avatar|profile-avatar)\s*\{[^}]*border\s*:\s*4rpx\s+solid\s+#d33")),
        ("保留小程序组件与 styleIsolation 配置", lambda t: has(output_file(t, "profile-card.mpx"), r"createComponent") and has(output_file(t, "profile-card.mpx"), r"styleIsolation\s*['\"]?\s*:\s*['\"]isolated['\"]")),
    ],
    "eval-2-dynamic-event-wxs": [
        ("小程序保留 WXS 高频手势路径", lambda t: has(t, r"<script\b[^>]*\blang\s*=\s*['\"]wxs['\"]") and has(t, r"(?:catch|bind)touch(?:start|move|end)@wx\s*=\s*['\"]\{\{\s*gesture\.")),
        ("Web 不再把 WXS 函数引用直接作为触摸处理器", web_touch_handlers_isolated),
        ("Web 的 start、move、end、cancel 均绑定组件实例方法", lambda t: all(has(t, rf"(?:@touch{phase}@web|(?:catch|bind)touch{phase})\s*=\s*['\"](?:on|handle)\w+['\"]") for phase in ("start", "move", "end", "cancel"))),
        ("实例方法完整实现触摸起点和横向位移计算", lambda t: (
            has(t, r"function\s+\w*[Pp]ointX\s*\([^)]*\)\s*\{[\s\S]{0,320}(?:clientX|pageX)")
            and has(t, r"(?:on|handle)\w*[Tt]ouchStart\s*\([^)]*\)\s*\{[\s\S]{0,260}\w*[Pp]ointX\s*\(")
            and has(t, r"(?:on|handle)\w*[Tt]ouchMove\s*\([^)]*\)\s*\{[\s\S]{0,360}\w*[Pp]ointX\s*\([^)]*\)\s*-\s*this\.\w*(?:start|Start)")
        ) or (
            has(t, r"(?:on|handle)\w*[Tt]ouchStart\s*\([^)]*\)\s*\{(?=[\s\S]{0,520}(?:clientX|pageX))(?=[\s\S]{0,520}this\.\w*(?:start|Start)\w*\s*=)")
            and has(t, r"(?:on|handle)\w*[Tt]ouchMove\s*\([^)]*\)\s*\{(?=[\s\S]{0,700}(?:clientX|pageX))(?=[\s\S]{0,700}-\s*this\.\w*(?:start|Start))")
        )),
        ("滑动位移被限制在 -96 到 0", lambda t: has(t, r"(?:Math\.max\s*\(\s*-96[\s\S]{0,100}Math\.min\s*\(\s*0|-96[\s\S]{0,220}(?:>\s*0|Math\.min)|(?:>\s*0|Math\.min)[\s\S]{0,220}-96)")),
        ("松手按 -48 阈值展开或回弹", lambda t: has(t, r"(?:<=?\s*-48|<\s*-48|-48\s*>=?)") and has(t, r"(?:open\s*\?\s*-96\s*:\s*0|-96\s*:\s*0)")),
        ("滑动结束事件保留商品 id 和展开状态", lambda t: has(t, r"triggerEvent\s*\(\s*['\"]swipeend['\"][\s\S]{0,180}\bid\b[\s\S]{0,100}\bopen\b")),
        ("选择和删除在 disabled 时均阻止执行", lambda t: all(has(t, rf"{name}\s*\([^)]*\)\s*\{{[\s\S]{{0,160}}if\s*\(\s*this\.disabled\s*\)\s*return") for name in ("selectItem", "removeItem"))),
        ("删除按钮阻止冒泡并保留商品 id", lambda t: has(t, r"<button\b[^>]*catchtap\s*=\s*['\"]removeItem['\"]") and has(t, r"triggerEvent\s*\(\s*['\"]remove['\"][\s\S]{0,120}\bid\b")),
        ("Web 手势状态保存在组件实例而非普通脚本模块变量", lambda t: not has_module_scope_gesture_state(t)),
        ("touchcancel 回弹并以未展开状态结束", web_touch_cancel_safe),
        ("有效滑动后抑制浏览器合成的条目点击", lambda t: has(t, r"(?:moved|suppress|dragged|swiping)") and has(t, r"selectItem\s*\([^)]*\)\s*\{[\s\S]{0,260}(?:moved|suppress|dragged|swiping)[\s\S]{0,100}return")),
    ],
    "eval-3-unsupported-api": [
        ("小程序端保留选择位置、打开地图和选择媒体能力", lambda t: has(t, r"chooseLocation") and has(t, r"openLocation") and has(t, r"chooseMedia")),
        ("缺失 API 与小程序实现按平台隔离", isolated),
        ("Web 位置选择保留业务 Bridge/SDK TODO", lambda t: method_has_todo(t, "choosePlace")),
        ("Web 地图打开保留业务 Bridge/SDK TODO", lambda t: method_has_todo(t, "openPlace")),
        ("Web 媒体选择保留业务 Bridge/SDK TODO", lambda t: method_has_todo(t, "choosePhoto")),
        ("未擅自使用纯浏览器位置、地图或文件替代", lambda t: lacks(t, r"navigator\.geolocation|window\.open|location\.(?:href|assign)|createElement\s*\(\s*['\"]input['\"]|type\s*=\s*['\"]file['\"]")),
    ],
    "eval-4-socket-task": [
        ("保留 roomId 属性并用于房间连接地址", lambda t: has(t, r"properties\s*:\s*\{[\s\S]{0,180}\broomId\b") and has(t, r"wss://chat\.example\.com/rooms/[\s\S]{0,80}(?:roomId|\$\{\s*this\.roomId\s*\})")),
        ("保留手动重连入口和方法", lambda t: has(t, r"<button\b[^>]*bindtap\s*=\s*['\"]reconnect['\"]") and has(t, r"\breconnect\s*\([^)]*\)\s*\{")),
        ("connectSocket 使用 Mpx/api-proxy 统一入口", lambda t: uses_api(t, "connectSocket") and lacks(t, r"\bwx\.connectSocket")),
        ("保存 connectSocket 返回的 SocketTask", lambda t: has(t, r"(?:this\.)?\w*(?:socket|task)\w*\s*=\s*(?:mpx\.)?connectSocket\s*\(")),
        ("使用 SocketTask 监听连接、消息和错误", lambda t: has(t, r"\.onOpen\s*\(") and has(t, r"\.onMessage\s*\(") and has(t, r"\.onError\s*\(")),
        ("使用 SocketTask send 发送消息", lambda t: has(t, r"\.send\s*\(")),
        ("卸载时通过 SocketTask close 清理连接", socket_detach_closes_task),
        ("不再使用 Web 不支持的全局 Socket API", lambda t: lacks(t, r"\b(?:wx|mpx)\.(?:sendSocketMessage|closeSocket|onSocketOpen|onSocketMessage|onSocketError|onSocketClose)\b")),
        ("所有连接回调均校验捕获任务仍是当前任务", socket_callbacks_guard_current_task),
        ("重连替换任务时废弃并关闭旧连接", socket_replacement_safe),
        ("发送仅允许当前已打开的任务", socket_send_current_open_task),
        ("卸载先标记失效或清空任务身份再关闭", socket_detach_invalidates_before_close),
    ],
    "eval-5-web-lifecycle": [
        ("保留小程序分享按钮和 onShareAppMessage", lambda t: has(t, r"open-type(?:@wx)?\s*=\s*['\"]share['\"]") and has(t, r"onShareAppMessage\s*(?:\(|=\s*function)")),
        ("Web 通过 implement remove 移除分享生命周期", lambda t: has(t, r"implement\s*\(\s*['\"]onShareAppMessage['\"][\s\S]{0,220}modes\s*:\s*\[\s*['\"]web['\"][\s\S]{0,140}remove\s*:\s*true")),
        ("宿主跳转使用 Mpx/api-proxy 统一入口", lambda t: uses_api(t, "navigateTo") and lacks(t, r"\bwx\.navigateTo")),
        ("Web 分享入口绑定独立的组件实例方法", lambda t: has(t, r"<button\b[^>]*(?:bindtap@_?web|bindtap|@tap(?:@web)?)\s*=\s*['\"](?:share\w*)['\"]") and has(t, r"share\w*\s*\(")),
        ("Web 分享方法保留明确的业务接入 TODO", lambda t: has(t, r"share\w*\s*\([^)]*\)\s*\{[\s\S]{0,240}(?:TODO|待接入|业务分享|分享 SDK|share SDK)")),
        ("未擅自选择 Web Share 或 clipboard 降级", lambda t: lacks(t, r"navigator\.share|navigator\.clipboard|clipboard\.writeText")),
    ],
    "eval-6-ssr-product-detail": [
        ("SSR 首屏通过 serverPrefetch 等待商品数据", lambda t: has(t, r"serverPrefetch\s*\([^)]*\)\s*\{[\s\S]{0,900}(?:return\s+|await\s+)(?:this\.)?\w*")),
        ("商品请求可在 Node 执行且不再直接调用 wx.request", ssr_request_server_safe),
        ("小程序 onLoad 仍可加载同一商品业务", lambda t: has(t, r"onLoad\s*\([^)]*\)\s*\{[\s\S]{0,500}(?:load|fetch|request)[A-Za-z]*\s*\(")),
        ("Pinia 在 onAppInit 中按 SSR 请求创建并返回", ssr_pinia_per_request),
        ("服务端执行路径不直接访问浏览器全局对象", ssr_browser_objects_safe),
        ("异步分包 SSR 开启 useSSR 并使用 history 路由", lambda t: has(t, r"useSSR\s*:\s*true") and has(t, r"routeConfig\s*:\s*\{[\s\S]{0,180}mode\s*:\s*['\"]history['\"]")),
        ("保留商品分包和页面交互", lambda t: has(t, r"packageProduct") and has(t, r"pages/detail/index") and has(t, r"addToCart\s*\(")),
        ("注水状态记录商品身份并避免客户端重复首屏请求", ssr_hydration_reuse_by_id),
        ("SSR 请求地址不写死 localhost", lambda t: lacks(output_file(t, "product-detail.mpx"), r"https?://(?:localhost|127\.0\.0\.1)")),
    ]
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--groups", nargs="*", default=["no_skill", "has_skill"])
    args = parser.parse_args()
    evals = json.loads((ROOT / "evals.json").read_text())
    results = []
    for item in evals:
        for group in args.groups:
            output_paths = [ROOT / item["id"] / group / "outputs" / name for name in item["outputs"]]
            existing = [path for path in output_paths if path.exists()]
            if not existing:
                continue
            text = "\n".join(
                f"/* OUTPUT_FILE:{path.name} */\n{path.read_text()}"
                for path in existing
            )
            expectations = [
                {"text": label, "passed": checker(text), "evidence": "静态契约检查"}
                for label, checker in RUBRICS[item["id"]]
            ]
            if item["id"] in {"eval-1-style-isolation", "eval-6-ssr-product-detail"}:
                expectations.insert(0, {
                    "text": "完整输出本用例要求的全部文件",
                    "passed": len(existing) == len(output_paths),
                    "evidence": "输出文件完整性检查"
                })
            result = {
                "eval_id": item["id"], "eval_name": item["name"], "configuration": group,
                "expectations": expectations,
                "summary": {"passed": sum(x["passed"] for x in expectations), "total": len(expectations)}
            }
            run_dir = ROOT / item["id"] / group / "run-1"
            run_dir.mkdir(parents=True, exist_ok=True)
            (run_dir / "grading.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
            results.append(result)
    (ROOT / "benchmark-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
