#!/usr/bin/env python3
"""Deterministically grade Mpx2Web iteration-12 outputs."""
import argparse
import ast
import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
GROUPS = ("mpx2web", "no_skill")


def load_config():
    return json.loads((WORKSPACE / "evals.json").read_text())


def read(root, relative):
    path = root / relative
    return path.read_text() if path.is_file() else ""


def blocks(source):
    result = {"template": "", "script": "", "style": "", "json": ""}
    result["template"] = "\n".join(re.findall(r"<template(?:\s[^>]*)?>(.*?)</template>", source, re.S | re.I))
    result["style"] = "\n".join(re.findall(r"<style(?:\s[^>]*)?>(.*?)</style>", source, re.S | re.I))
    for match in re.finditer(r"<script(?P<attrs>(?:\s[^>]*)?)>(?P<body>.*?)</script>", source, re.S | re.I):
        attrs = match.group("attrs").lower()
        key = "json" if 'name="json"' in attrs or "name='json'" in attrs or 'type="application/json"' in attrs or "type='application/json'" in attrs else "script"
        result[key] += "\n" + match.group("body")
    return result


def all_present(source, *patterns):
    return all(re.search(pattern, source, re.S) for pattern in patterns)


def strip_comments(source):
    return re.sub(r"/\*.*?\*/|<!--.*?-->|//[^\n]*", "", source, flags=re.S)


def condition_matches_mode(condition, mode, variables=None):
    """Evaluate the small expression subset used by Mpx platform guards."""
    variables = variables or {}
    expression = condition.replace("!==", "!=").replace("===", "==")
    expression = expression.replace("&&", " and ").replace("||", " or ")
    expression = re.sub(r"!(?!=)", " not ", expression).strip()

    def evaluate(node):
        if isinstance(node, ast.Expression):
            return evaluate(node.body)
        if isinstance(node, ast.BoolOp):
            values = [evaluate(value) for value in node.values]
            return all(values) if isinstance(node.op, ast.And) else any(values)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            return not evaluate(node.operand)
        if isinstance(node, ast.Compare) and len(node.ops) == 1:
            left = evaluate(node.left)
            right = evaluate(node.comparators[0])
            if isinstance(node.ops[0], ast.Eq):
                return left == right
            if isinstance(node.ops[0], ast.NotEq):
                return left != right
        if isinstance(node, ast.Name):
            if node.id in variables:
                return variables[node.id]
            if node.id == "__mpx_mode__":
                return mode
        if isinstance(node, ast.Constant) and isinstance(node.value, (bool, str)):
            return node.value
        raise ValueError

    try:
        return bool(evaluate(ast.parse(expression, mode="eval")))
    except (SyntaxError, ValueError):
        return None


def condition_variables(source, mode):
    assignments = re.findall(
        r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)",
        strip_comments(source),
    )
    variables = {}
    unresolved = assignments
    while unresolved:
        next_unresolved = []
        for name, expression in unresolved:
            value = condition_matches_mode(expression, mode, variables)
            if value is None:
                next_unresolved.append((name, expression))
            else:
                variables[name] = value
        if len(next_unresolved) == len(unresolved):
            break
        unresolved = next_unresolved
    return variables


def valid_mpx_conditionals(source):
    """Accept balanced, evaluable Mpx condition comments instead of banning them."""
    block_pattern = re.compile(
        r"(?:<!--|/\*)\s*@mpx-(?P<kind>if|elif|else|endif|end-if)\b"
        r"(?P<condition>.*?)(?:-->|\*/)",
        re.S | re.I,
    )
    line_pattern = re.compile(
        r"//\s*@mpx-(?P<kind>if|elif|else|endif|end-if)\b"
        r"(?P<condition>[^\n]*)",
        re.I,
    )
    directives = sorted(
        list(block_pattern.finditer(source)) + list(line_pattern.finditer(source)),
        key=lambda match: match.start(),
    )
    stack = []
    variables_by_mode = {
        mode: condition_variables(source, mode)
        for mode in ("wx", "web")
    }
    for directive in directives:
        kind = directive.group("kind").lower()
        if kind == "end-if":
            return False
        if kind in {"if", "elif"}:
            if kind == "elif" and (not stack or stack[-1]):
                return False
            condition = directive.group("condition").strip()
            values = [
                condition_matches_mode(condition, mode, variables_by_mode[mode])
                for mode in ("wx", "web")
            ]
            if any(value is None for value in values):
                return False
            if kind == "if":
                stack.append(False)
        elif kind == "else":
            if not stack or stack[-1]:
                return False
            stack[-1] = True
        elif kind == "endif":
            if not stack:
                return False
            stack.pop()
    return not stack


def mode_guard(source, mode):
    quoted = rf"['\"]{re.escape(mode)}['\"]"
    return bool(re.search(rf"\bif\s*\([^)]*__mpx_mode__\s*={{2,3}}\s*{quoted}[^)]*\)", source, re.S))


def platform_attribute(source, name, mode):
    return bool(re.search(
        rf"\b{re.escape(name)}@(?:[\w-]+\|)*_?{re.escape(mode)}(?:\|[\w-]+)*\b",
        source,
    ))


def platform_attribute_value(source, name, mode, value):
    return bool(re.search(
        rf"\b{re.escape(name)}@(?:[\w-]+\|)*_?{re.escape(mode)}(?:\|[\w-]+)*"
        rf"\s*=\s*['\"]{re.escape(value)}['\"]",
        source,
    ))


def attribute_available_on_web(source, name):
    """Accept an unqualified attribute or an explicit @web attribute."""
    unqualified = bool(re.search(
        rf"\b{re.escape(name)}(?!@)\s*=", source))
    return unqualified or platform_attribute(source, name, "web")


def has_platform_node(source, tag, mode):
    return bool(re.search(
        rf"<{re.escape(tag)}\b[^>]*@(?:[\w-]+\|)*_?{re.escape(mode)}"
        rf"(?:\|[\w-]+)*(?:\s|=|>)",
        source,
        re.S,
    ))


def platform_open_tags(source, tag, mode):
    """Return opening tags selected for a mode, including the @_mode alias."""
    selector = re.compile(
        rf"(?:^|\s)@(?:[\w-]+\|)*_?{re.escape(mode)}(?:\|[\w-]+)*(?:\s|=|$)"
    )
    return [
        match.group(0)
        for match in re.finditer(rf"<{re.escape(tag)}\b[^>]*>", source, re.S | re.I)
        if selector.search(match.group(0))
    ]


def tag_replaced_for_web(source, tag, replacement="view"):
    return bool(re.search(
        rf"<{re.escape(tag)}\b[^>]*\bmpxTagName@"
        rf"(?:[\w-]+\|)*_?web(?:\|[\w-]+)*\s*=\s*"
        rf"['\"]{re.escape(replacement)}['\"]",
        source,
        re.S | re.I,
    ))


def has_half_rpx_transform(source):
    """Accept direct division and an equivalent Number(value) local alias."""
    match = re.search(r"\btransRpxFn\s*:\s*function\s*\([^)]*\)\s*\{", source)
    if not match:
        return False
    start = source.find("{", match.start())
    body = extract_balanced_block(source, start)
    if re.search(r"Number\(\s*value\s*\)\s*/\s*2", body):
        return True
    aliases = re.findall(
        r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*Number\(\s*value\s*\)",
        body,
    )
    return any(re.search(rf"\b{re.escape(alias)}\s*/\s*2", body) for alias in aliases)


def on_app_init_injects_pinia(app_script):
    """Accept direct creation or a local instance returned as the pinia option."""
    body = method_body(app_script, "onAppInit")
    if not body:
        return False
    if re.search(r"\bpinia\s*:\s*createPinia\s*\(", body):
        return True
    aliases = re.findall(
        r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*createPinia\s*\(\s*\)",
        body,
    )
    for alias in aliases:
        returned_object = re.search(r"\breturn\s*\{(?P<body>[\s\S]*?)\}", body)
        if not returned_object:
            continue
        options = returned_object.group("body")
        if re.search(rf"(?:^|,)\s*{re.escape(alias)}\s*(?:,|$)", options):
            return True
        if re.search(rf"\bpinia\s*:\s*{re.escape(alias)}\b", options):
            return True
    return False


def extract_balanced_block(source, start):
    depth = 0
    quote = None
    escaped = False
    for index in range(start, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in "'\"`":
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[start:index + 1]
    return ""


def method_body(source, name):
    match = re.search(rf"\b{re.escape(name)}\s*\([^)]*\)\s*\{{", source)
    if not match:
        return ""
    start = source.find("{", match.start())
    block = extract_balanced_block(source, start)
    return block[1:-1] if block else ""


def component_has_local_toggle(template, script, field):
    """Follow the bound handler and accept direct assignment or setData."""
    handlers = re.findall(
        r"\bbindtap\s*=\s*['\"]([A-Za-z_$][\w$]*)['\"]",
        template,
    )
    for handler in handlers:
        body = method_body(script, handler)
        if re.search(
            rf"(?:this\.{re.escape(field)}\s*=\s*!this\.{re.escape(field)}|"
            rf"\b{re.escape(field)}\s*:\s*!this\.{re.escape(field)})",
            body,
        ):
            return True
    return False


def template_variants(source):
    return [
        (match.group("attrs"), match.group("body"))
        for match in re.finditer(
            r"<template(?P<attrs>(?:\s[^>]*)?)>(?P<body>.*?)</template>",
            source,
            re.S | re.I,
        )
    ]


def template_for_mode(source, mode):
    quoted = rf"['\"]{re.escape(mode)}['\"]"
    for attrs, body in template_variants(source):
        if re.search(rf"\bmode\s*=\s*{quoted}", attrs, re.I):
            return body
    return ""


def default_template(source):
    for attrs, body in template_variants(source):
        if not re.search(r"\bmode\s*=", attrs, re.I):
            return body
    return ""


def tag_isolated_by_web_override(source, tag):
    """Accept the Mpx shape: default/original template plus mode=web override."""
    original = default_template(source)
    web = template_for_mode(source, "web")
    tag_pattern = rf"<{re.escape(tag)}\b"
    return bool(web and re.search(tag_pattern, original) and not re.search(tag_pattern, web))


def handler_isolated_by_web_override(source, handler):
    """Accept a wx handler that is referenced only by the default template."""
    original = default_template(source)
    web = template_for_mode(source, "web")
    event_name = r"(?:bind|catch|capture-bind|capture-catch)[\w:-]*|@[\w:-]+"
    handler_pattern = (
        rf"(?:{event_name})\s*=\s*['\"][^'\"]*"
        rf"\b{re.escape(handler)}\b[^'\"]*['\"]"
    )
    return bool(
        web
        and re.search(handler_pattern, original)
        and not re.search(handler_pattern, web)
    )


def has_runtime_route_config(app_source, base):
    """Recognize property, assignment and Object.assign routeConfig definitions."""
    app_script = blocks(app_source)["script"]
    for match in re.finditer(r"\brouteConfig\s*(?::|=)", app_script):
        candidate = app_script[match.start():match.start() + 800]
        if all_present(
            candidate,
            r"\bmode\s*:\s*['\"]history['\"]",
            rf"\bbase\s*:\s*['\"]{re.escape(base)}['\"]",
        ):
            return True
    return False


def has_safe_media_fallback(source):
    type_guard = bool(re.search(
        r"typeof\s+[^\n]+\s*===\s*['\"]number['\"]", source))
    finite_guard = "Number.isFinite" in source and "Number(" in source
    return (
        "event.detail" in source
        and "event.target" in source
        and (type_guard or finite_guard)
    )


def has_page_server_prefetch(page_script):
    return all_present(
        page_script,
        r"(?:serverPrefetch|onServerPrefetch)\s*\(",
        r"\$route[\s\S]{0,120}?query[\s\S]{0,80}?id",
        r"(?:return|await)[\s\S]{0,240}?\.loadArticle\s*\(",
    )


def web_early_return_before(source, marker):
    """Recognize `if (__mpx_mode__ === 'web') return` before a host-only call."""
    return bool(re.search(
        rf"if\s*\([^)]*__mpx_mode__\s*={{2,3}}\s*['\"]web['\"][^)]*\)\s*"
        rf"(?:\{{[\s\S]{{0,500}}?\breturn\b[\s\S]{{0,100}}?\}}|\breturn\b)"
        rf"[\s\S]{{0,500}}?{re.escape(marker)}",
        source,
    ))


def guarded_from_web(source, marker):
    return mode_guard(source, "wx") or web_early_return_before(source, marker)


def assertion_rows(eval_id, verdicts):
    item = next(item for item in load_config()["evals"] if item["id"] == eval_id)
    expected = [row["id"] for row in item["assertions"]]
    if set(verdicts) != set(expected):
        raise ValueError(f"checker/assertion mismatch for eval {eval_id}")
    return [{"id": row["id"], "text": row["text"], "passed": bool(verdicts[row["id"]])}
            for row in item["assertions"]]


def check_eval_0(root):
    config = read(root, "mpx.config.js")
    app = read(root, "src/app.mpx")
    home = read(root, "src/pages/home/index.mpx")
    choice = read(root, "src/pages/choice/index.mpx")
    style_page = read(root, "src/pages/style/index.mpx")
    layout = read(root, "src/components/layout-cell.mpx")
    red = read(root, "src/components/red-card.mpx")
    blue = read(root, "src/components/blue-card.mpx")
    theme = read(root, "src/components/theme-card.mpx")
    red_scoped = bool(re.search(r"<style\b[^>]*\bscoped\b", red))
    blue_scoped = bool(re.search(r"<style\b[^>]*\bscoped\b", blue))
    layout_ok = (
        all_present(layout, r"virtualHost\s*:\s*true", r"flex\s*:\s*(?:1\b|1\s+1\s+0)")
        and all_present(style_page, r"\.equal-row\s*\{[^}]*display\s*:\s*flex", r"\.equal-row\s*\{[^}]*width\s*:\s*240px")
        and all_present(config, r"autoVirtualHostRules", r"layout-cell")
        and not re.search(r"row-(?:group|list)\.mpx|row-(?:group|list)\\\.mpx", config)
    )
    external_ok = (
        all_present(theme, r"externalClasses\s*:\s*\[[^]]*tone-class[^]]*custom-class", r"class\s*=\s*['\"][^'\"]*tone-class[^'\"]*custom-class")
        and all_present(style_page, r"tone-class\s*=\s*['\"]warm-tone", r"tone-class\s*=\s*['\"]cool-tone", r"\.warm-tone\s*\{[^}]*color", r"\.cool-tone\s*\{[^}]*color", r"\.spaced-label\s*\{[^}]*padding\s*:\s*12px")
        and all(token in config for token in ("custom-class", "i-class", "tone-class"))
    )
    navigation_ok = (
        all_present(home, r"<navigator\b[^>]*url\s*=\s*['\"]/pages/choice/index\?source=link['\"][^>]*open-type\s*=\s*['\"]navigate", r"openChoice", r"ready\s*:\s*\(\)\s*=>[^}]*selectedLabel\s*=\s*['\"]正在选择")
        and all_present(choice, r"query\.source", r"['\"]link['\"]", r"emit\(['\"]ready['\"]", r"confirm\s*\(\s*label\s*\)")
        and ("receiveChoice(label)" in choice or bool(set(re.findall(r"events\s*:\s*\{.*?([A-Za-z_$][\w$]*)\s*:\s*", home, re.S)) & set(re.findall(r"emit\(['\"]([^'\"]+)['\"]\s*,\s*label", choice))))
    )
    capsule_guarded = "getMenuButtonBoundingClientRect" in home and (
        guarded_from_web(home, "getMenuButtonBoundingClientRect")
        or bool(re.search(r"if\s*\([^)]*__mpx_mode__\s*!={1,2}\s*['\"]web['\"]", home))
    )
    navigation_bar_ok = capsule_guarded and "navigationStyle" in app and "custom" in app
    route_ok = (
        all_present(config, r"publicPath\s*:\s*['\"]/help-demo/['\"]")
        and has_runtime_route_config(app, "/help-demo/")
        and all(page in app for page in ("pages/home/index", "pages/choice/index", "pages/style/index", "packageA", "packageB"))
    )
    rpx_ok = has_half_rpx_transform(config)
    return assertion_rows(0, {
        "C1.4": red_scoped and blue_scoped,
        "C1.5": layout_ok,
        "C1.6": external_ok,
        "C4.1": navigation_ok,
        "C4.2": navigation_bar_ok,
        "C4.3": route_ok,
        "C4.4": rpx_ok,
    })


def check_eval_1(root):
    config = read(root, "mpx.config.js")
    app = read(root, "src/app.mpx")
    card = read(root, "src/components/profile-card.mpx")
    page = read(root, "src/pages/profile/index.mpx")
    app_blocks = blocks(app)
    page_blocks = blocks(page)
    card_blocks = blocks(card)
    files_ok = all((root / name).is_file() for name in (
        "mpx.config.js", "src/app.mpx", "src/components/profile-card.mpx", "src/pages/profile/index.mpx"))
    skeleton_ok = files_ok and all_present(app_blocks["json"], r"pages/profile/index") and all_present(page_blocks["json"], r"profile-card") and len(re.findall(r"<profile-card\b", page_blocks["template"])) == 2 and "createApp" in app_blocks["script"] and "createPage" in page_blocks["script"] and "createComponent" in card_blocks["script"]
    route_ok = (
        all_present(config, r"publicPath\s*:\s*(?:['\"]/profile-demo/['\"]|\w+)")
        and has_runtime_route_config(app, "/profile-demo/")
    )
    component_options = card_blocks["script"]
    external_ok = (
        all(token in config for token in ("custom-class", "i-class", "accent-class"))
        and "plugin:" in config and bool(re.search(r"externalClasses\s*:\s*\[[^]]*accent-class", component_options))
        and "accent-class" in card_blocks["template"]
        and all_present(page, r"accent-class\s*=\s*['\"]warm-title", r"accent-class\s*=\s*['\"]cool-title", r"\.warm-title\s*\{[^}]*padding\s*:\s*12px[^}]*color|\.warm-title\s*\{[^}]*color[^}]*padding\s*:\s*12px", r"\.cool-title\s*\{[^}]*padding\s*:\s*12px[^}]*color|\.cool-title\s*\{[^}]*color[^}]*padding\s*:\s*12px")
    )
    interaction_ok = (
        all_present(component_options, r"title\s*:", r"summary\s*:", r"expanded\s*:\s*false")
        and component_has_local_toggle(card_blocks["template"], component_options, "expanded")
        and "wx:if=\"{{ expanded }}\"".replace(" ", "") in card_blocks["template"].replace(" ", "")
        and len(re.findall(r"<profile-card\b", page_blocks["template"])) == 2
    )
    share_data = all_present(page_blocks["script"], r"onShareAppMessage", r"title\s*:\s*['\"]个人资料['\"]", r"path\s*:\s*['\"]/pages/profile/index['\"]")
    share_removed = bool(re.search(r"implement\s*\(\s*['\"]onShareAppMessage['\"][\s\S]*?modes\s*:\s*\[[^]]*['\"]web['\"][^]]*\][\s\S]*?remove\s*:\s*true", page_blocks["script"]))
    share_isolated = share_removed or (mode_guard(page_blocks["script"], "wx") and "onShareAppMessage" in page_blocks["script"])
    share_boundary = bool(re.search(r"Web[^<\n]*(?:分享|未接入)|TODO\(web\)[^\n]*(?:分享|协议)", page, re.I))
    return assertion_rows(1, {
        "C2.1": skeleton_ok,
        "C2.2": route_ok,
        "C2.3": external_ok,
        "C2.4": interaction_ok,
        "C2.5": share_data and share_isolated and share_boundary,
    })


def check_eval_2(root):
    app = read(root, "src/app.mpx")
    content = read(root, "src/pages/content/index.mpx")
    scan = read(root, "src/components/scan-entry.mpx")
    video = read(root, "src/components/video-info.mpx")
    store = read(root, "src/pages/store-picker/index.mpx")
    catalog = read(root, "src/pages/catalog/index.mpx")
    vendor = read(root, "src/vendor/native-scanner/index.mpx")
    input_vendor = read(WORKSPACE / "eval-2-api-share-components/input", "src/vendor/native-scanner/index.mpx")
    content_blocks = blocks(content)
    scan_blocks = blocks(scan)
    catalog_blocks = blocks(catalog)
    input_draft = re.search(r"<input\b[^>]*\bvalue\s*=\s*['\"]\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}['\"]", content, re.S)
    draft_name = input_draft.group(1) if input_draft else ""
    confirm_body = re.search(r"confirmRename\s*\([^)]*\)\s*\{(?P<body>[\s\S]*?)\n\s*\}", content_blocks["script"])
    cancel_body = re.search(r"cancelRename\s*\([^)]*\)\s*\{(?P<body>[\s\S]*?)\n\s*\}", content_blocks["script"])
    edit_chain = bool(
        draft_name
        and confirm_body
        and cancel_body
        and re.search(rf"\bdisplayName\s*=\s*this\.{re.escape(draft_name)}\b", confirm_body.group("body"))
        and not re.search(r"\bdisplayName\s*=", cancel_body.group("body"))
        and valid_mpx_conditionals(content)
        and (
            mode_guard(content_blocks["script"], "wx")
            or mode_guard(content_blocks["script"], "web")
            or handler_isolated_by_web_override(content, "rename")
        )
    )
    scanner_json_ok = mode_guard(scan_blocks["json"], "wx") and "native-scanner" in scan_blocks["json"]
    scanner_template_ok = (
        has_platform_node(scan_blocks["template"], "native-scanner", "wx")
        or bool(re.search(r"<template\b[^>]*mode\s*=\s*['\"]wx['\"]", scan))
        or tag_isolated_by_web_override(scan, "native-scanner")
    )
    scanner_ok = vendor == input_vendor and scanner_json_ok and scanner_template_ok and "TODO(web)" in scan and valid_mpx_conditionals(scan)
    video_ok = all_present(video, r"<video\b", r"src\s*=\s*['\"]\{\{src\}\}['\"]", r"bindtimeupdate", r"bindloadedmetadata") and has_safe_media_fallback(video)
    location_ok = (
        all_present(content, r"(?:wx|mpx)\.chooseLocation", r"placeName\s*=\s*result\.name", r"TODO\(web\)[^\n]*(?:位置|地图)")
        and (
            guarded_from_web(content_blocks["script"], "chooseLocation")
            or handler_isolated_by_web_override(content, "choosePlace")
        )
        and valid_mpx_conditionals(content_blocks["script"])
    )
    app_json = blocks(app)["json"]
    plugin_template_ok = has_platform_node(content_blocks["template"], "foo-card", "wx") or tag_isolated_by_web_override(content, "foo-card")
    plugin_ok = mode_guard(app_json, "wx") and all_present(app_json, r"appConfig", r"plugins", r"pages") and mode_guard(content_blocks["json"], "wx") and "plugin://foo/component" in content_blocks["json"] and plugin_template_ok and valid_mpx_conditionals(app_json + content_blocks["json"])
    web_store_template = template_for_mode(store, "web")
    web_picker_in_shared_template = (
        platform_attribute_value(store, "mode", "web", "selector")
        and platform_attribute(store, "range", "web")
        and platform_attribute(store, "value", "web")
        and bool(re.search(r"@change@web\s*=\s*['\"]onWebRegionChange['\"]", store))
    )
    web_picker_node = any(
        all_present(
            tag,
            r"\bmode\s*=\s*['\"]selector['\"]",
            r"\brange\s*=",
            r"\bbindchange\s*=\s*['\"]onWebRegionChange['\"]",
        )
        for tag in platform_open_tags(store, "picker", "web")
    )
    region_web_ok = (
        bool(re.search(r"TODO\(web\)[^\n]*(?:地区|行政区)", store))
        or (
            all_present(web_store_template, r"<picker\b", r"mode\s*=\s*['\"]selector['\"]", r"bindchange")
            and all_present(store, r"regionOptions", r"onWebRegionChange", r"regionNames\s*=", r"regionCodes\s*=", r"regionText\s*=")
        )
        or (
            web_picker_in_shared_template
            and all_present(store, r"regionOptions", r"onWebRegionChange", r"regionNames\s*=", r"regionCodes\s*=", r"regionText\s*=")
        )
        or (
            web_picker_node
            and all_present(store, r"regionOptions", r"onWebRegionChange", r"regionNames\s*=", r"regionCodes\s*=", r"regionText\s*=")
        )
    )
    picker_region = (
        bool(re.search(r"<picker\b[^>]*\bmode\s*=\s*['\"]region['\"]", store, re.S))
        or platform_attribute_value(store, "mode", "wx", "region")
    )
    picker_isolated = (
        has_platform_node(store, "picker", "wx")
        or bool(re.search(r"<template\b[^>]*mode\s*=\s*['\"]wx['\"]", store))
        or bool(web_store_template and re.search(r"<picker\b[^>]*mode\s*=\s*['\"]region['\"]", default_template(store), re.S))
        or (
            platform_attribute_value(store, "mode", "wx", "region")
            and platform_attribute_value(store, "mode", "web", "selector")
        )
    )
    map_isolated = (
        has_platform_node(store, "map", "wx")
        or bool(re.search(r"<template\b[^>]*mode\s*=\s*['\"]wx['\"]", store))
        or tag_isolated_by_web_override(store, "map")
    )
    region_map_ok = (
        picker_region
        and all_present(store, r"<map\b", r"regionNames", r"regionCodes", r"regionText", r"mapCenter", r"storeMarkers", r"bindmarkertap", r"markerId", r"selectedStoreId", r"selectedStoreName", r"TODO\(web\)[^\n]*(?:地图|SDK)")
        and picker_isolated
        and map_isolated
        and region_web_ok
        and valid_mpx_conditionals(store)
    )
    swiper_ok = (
        all_present(catalog, r"<swiper\b", r"bindchange", r"wx:key\s*=\s*['\"]id['\"]")
        and attribute_available_on_web(catalog, "previous-margin")
        and attribute_available_on_web(catalog, "next-margin")
        and platform_attribute(catalog, "display-multiple-items", "wx")
        and bool(re.search(r"TODO\(web\)[^\n]*(?:轮播|同屏)", catalog))
    )
    image_common = all_present(catalog, r"<image\b", r"src\s*=\s*['\"]\{\{item\.cover\}\}['\"]", r"mode\s*=\s*['\"]aspectFill['\"]")
    image_local_isolation = (platform_attribute(catalog, "lazy-load", "wx") or has_platform_node(catalog, "image", "wx")) and bool(re.search(r"TODO\(web\)[^\n]*(?:图片|加载|lazy)", catalog))
    image_in_wx_structure = bool(re.search(r"<grid-view\b[^>]*@(?:[\w-]+\|)*wx(?:\|[\w-]+)*(?:\s|=|>)[\s\S]*?<image\b[^>]*\blazy-load\b[\s\S]*?</grid-view>", catalog))
    image_ok = image_common and (image_local_isolation or image_in_wx_structure)
    structure_state = all_present(
        catalog,
        r"<grid-view\b", r"<grid-item\b", r"filteredProducts", r"selectProduct",
        r"<page-container\b", r"filterVisible", r"cancelFilter", r"confirmFilter",
    )
    structure_todo_boundary = (
        all_present(
            catalog,
            r"TODO\(web\)[^\n]*(?:网格|列表)",
            r"TODO\(web\)[^\n]*(?:对话框|面板|drawer|dialog|portal)",
        )
        and has_platform_node(catalog, "grid-view", "wx")
        and has_platform_node(catalog, "page-container", "wx")
    )
    structure_web_implementation = (
        tag_replaced_for_web(catalog, "grid-view")
        and tag_replaced_for_web(catalog, "grid-item")
        and tag_replaced_for_web(catalog, "page-container")
        and all_present(
            catalog,
            r"\.product-grid\s*\{[^}]*display\s*:\s*(?:grid|flex)",
            r"\.filter-container\s*\{[^}]*position\s*:\s*fixed",
            r"wx:if@_?web\s*=\s*['\"]\{\{\s*filterVisible\s*\}\}['\"]",
            r"wx:key\s*=\s*['\"]id['\"]",
        )
    )
    separate_web_structure = (
        has_platform_node(catalog, "grid-view", "wx")
        and has_platform_node(catalog, "page-container", "wx")
        and any(
            re.search(r"\bclass\s*=\s*['\"][^'\"]*\bproduct-grid\b", tag)
            for tag in platform_open_tags(catalog, "view", "web")
        )
        and any(
            all_present(
                tag,
                r"\bclass\s*=\s*['\"][^'\"]*\bfilter-overlay\b",
                r"\bwx:if\s*=\s*['\"]\{\{\s*filterVisible\s*\}\}['\"]",
            )
            for tag in platform_open_tags(catalog, "view", "web")
        )
        and all_present(
            catalog,
            r"\.product-grid\s*\{[^}]*display\s*:\s*(?:grid|flex)",
            r"\.filter-overlay\s*\{[^}]*position\s*:\s*fixed",
            r"wx:key\s*=\s*['\"]id['\"]",
        )
    )
    structures_ok = (
        structure_state
        and (structure_todo_boundary or structure_web_implementation or separate_web_structure)
        and valid_mpx_conditionals(catalog)
    )
    state_ok = all_present(store, r"confirmSelection\s*\(\)[\s\S]*?regionText[\s\S]*?selectedStoreName") and all_present(catalog, r"openFilter\s*\(\)[\s\S]*?draftCategory\s*=\s*this\.appliedCategory[\s\S]*?filterVisible\s*=\s*true", r"cancelFilter\s*\(\)[\s\S]*?filterVisible\s*=\s*false", r"confirmFilter\s*\(\)[\s\S]*?appliedCategory\s*=\s*this\.draftCategory[\s\S]*?filterVisible\s*=\s*false", r"filteredProducts\s*\(\)[\s\S]*?this\.appliedCategory")
    return assertion_rows(2, {
        "C3.2": edit_chain,
        "C3.3": scanner_ok,
        "C3.4": video_ok,
        "C3.5": location_ok,
        "C3.6": plugin_ok,
        "C5.1": region_map_ok,
        "C5.2": swiper_ok and image_ok,
        "C5.3": structures_ok,
        "C5.4": state_ok,
    })


def check_eval_3(root):
    config = read(root, "mpx.config.js")
    app = read(root, "src/app.mpx")
    page = read(root, "src/pages/article/index.mpx")
    store = read(root, "src/store/article.js")
    service = read(root, "src/services/article.js")
    app_script = blocks(app)["script"]
    page_script = blocks(page)["script"]
    route_ok = has_runtime_route_config(app, "/help-demo/")
    page_prefetch = has_page_server_prefetch(page_script)
    app_prefetch = all_present(app_script, r"onSSRAppCreated\s*\(", r"router\.(?:currentRoute\.)?query\.id|router\.currentRoute\.query\.id", r"await\s+\w+\.loadArticle\s*\(", r"context\.state\s*=", r"(?:return|resolve\s*\()\s*app")
    preload_ok = route_ok and (page_prefetch or app_prefetch)
    page_uses_pinia = (
        all_present(page_script, r"@mpxjs/pinia", r"mapState", r"mapActions")
        or all_present(page_script, r"import\s+\w+\s+from\s+['\"][^'\"]*store/article['\"]", r"useArticleStore\s*\(\s*this\.\$pinia\s*\)", r"loadArticle")
    )
    pinia_ok = (
        all_present(
            store,
            r"from\s+['\"]@mpxjs/pinia['\"]",
            r"defineStore\s*\(",
            r"article\s*:\s*null",
            r"loading\s*:\s*true",
            r"errorText\s*:\s*['\"]['\"]",
            r"loadArticle",
        )
        and "createStore" not in store
        and all_present(app_script, r"from\s+['\"]@mpxjs/pinia['\"]", r"onAppInit\s*\(")
        and on_app_init_injects_pinia(app_script)
        and page_uses_pinia
    )
    on_app_init = re.search(r"onAppInit\s*\([^)]*\)\s*\{(?P<body>[\s\S]*?)\n\s*\}", app_script)
    before_app_init = app_script[:on_app_init.start()] if on_app_init else app_script
    isolated_ok = bool(on_app_init and "createPinia()" in on_app_init.group("body") and "createPinia()" not in before_app_init)
    if "onSSRAppCreated" in app_script:
        isolated_ok = isolated_ok and bool(re.search(r"useArticleStore\s*\(\s*pinia\s*\)", app_script))
    server_sources = "\n".join((app_script, page_script, store, service))
    browser_safe = not re.search(r"\b(?:window|document|navigator)\b", server_sources)
    wx_ok = all_present(page_script, r"onLoad\s*\(\s*query\s*\)", r"query(?:\s*&&\s*query)?\.id|query\.id", r"loadArticle\s*\(") and all_present(page, r"article\.title", r"article\.body", r"errorText", r"loading", r"expanded", r"toggleExtra") and all_present(store, r"this\.article\s*=", r"this\.loading\s*=", r"this\.errorText\s*=") and "createStore" not in page_script + store
    return assertion_rows(3, {
        "C6.1": preload_ok,
        "C6.2": pinia_ok,
        "C6.3": isolated_ok,
        "C6.4": browser_safe,
        "C6.5": wx_ok,
    })


CHECKERS = {0: check_eval_0, 1: check_eval_1, 2: check_eval_2, 3: check_eval_3}


def _number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def load_metrics(run_dir):
    path = run_dir / "metrics.json"
    if not path.is_file():
        return None, []
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as error:
        return None, [f"invalid metrics json: {error}"]
    total_tokens = data.get("total_tokens")
    tool_calls = data.get("tool_calls")
    duration_ms = data.get("duration_ms")
    errors = []
    for name, value in (("total_tokens", total_tokens), ("tool_calls", tool_calls), ("duration_ms", duration_ms)):
        if not _number(value) or value < 0:
            errors.append(f"metrics.{name} must be a non-negative number")
    if errors:
        return None, errors
    return {"total_tokens": int(total_tokens), "tool_calls": int(tool_calls), "duration_ms": int(duration_ms), "duration_seconds": round(duration_ms / 1000, 3)}, []


def paths(eval_id, group, run_number):
    item = next(item for item in load_config()["evals"] if item["id"] == eval_id)
    case = WORKSPACE / f"eval-{item['id']}-{item['name']}"
    run = case / group / f"run-{run_number}"
    output = case / group / "outputs" if run_number == 1 else run / "outputs"
    return item, output, run


def grade_run(eval_id, group, run_number=1):
    item, output, run = paths(eval_id, group, run_number)
    missing = [name for name in item["outputs"] if not (output / name).is_file()]
    if missing:
        print(f"missing: {output}: {', '.join(missing)}", file=sys.stderr)
        return None
    results = CHECKERS[eval_id](output)
    enriched = [{**row, "evidence": "PASS" if row["passed"] else "FAIL"} for row in results]
    passed = sum(row["passed"] for row in enriched)
    metrics, metric_errors = load_metrics(run)
    if metric_errors:
        print(f"metrics warning for eval-{eval_id} / {group} / run-{run_number}: {'; '.join(metric_errors)}", file=sys.stderr)
    summary = {"pass_rate": round(passed / len(enriched), 4), "passed": passed, "failed": len(enriched) - passed, "total": len(enriched)}
    if metrics:
        summary.update(metrics)
    grading = {
        "eval_id": eval_id,
        "run_kind": group,
        "expectations": enriched,
        "summary": summary,
        "metrics": metrics,
        "timing": {"total_duration_seconds": metrics["duration_seconds"], "total_tokens": metrics["total_tokens"]} if metrics else {},
        "execution_metrics": {"total_tool_calls": metrics["tool_calls"], "output_chars": metrics["total_tokens"]} if metrics else {},
    }
    run.mkdir(parents=True, exist_ok=True)
    (run / "grading.json").write_text(json.dumps(grading, ensure_ascii=False, indent=2) + "\n")
    return grading


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evals", nargs="*", type=int)
    parser.add_argument("--groups", nargs="*", choices=GROUPS)
    parser.add_argument("--samples", type=int, default=1)
    args = parser.parse_args()
    ids = sorted(CHECKERS) if args.evals is None else args.evals
    groups = GROUPS if args.groups is None else args.groups
    if not ids or set(ids) - set(CHECKERS):
        parser.error("unknown or empty eval ids")
    if not groups or args.samples < 1:
        parser.error("groups and samples must be non-empty/positive")
    rows = []
    for run_number in range(1, args.samples + 1):
        for eval_id in ids:
            for group in groups:
                grade = grade_run(eval_id, group, run_number)
                if grade:
                    summary = grade["summary"]
                    rows.append({"eval": eval_id, "kind": group, "run": run_number, "score": f"{summary['passed']}/{summary['total']}"})
    print(json.dumps(rows, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
