#!/usr/bin/env python3
"""Deterministically grade Mpx2Web iteration-13 outputs."""
import argparse
import ast
import json
import re
import sys
import subprocess
from functools import lru_cache
from html.parser import HTMLParser
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent


def load_config():
    return json.loads((WORKSPACE / "evals.json").read_text())


GROUPS = tuple(group["id"] for group in load_config()["comparison"]["groups"])


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


@lru_cache(maxsize=256)
def javascript_probe(kind, source, mode="web", components=()):
    """Inspect effective code with the same dependencies as the model runs."""
    result = subprocess.run(
        ["node", str(Path(__file__).with_name("semantic_probe.cjs"))],
        input=json.dumps({"kind": kind, "source": source, "mode": mode,
                          "components": list(components)}),
        capture_output=True, text=True, timeout=15, check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr)
    return json.loads(result.stdout)


def effective_json(source, mode):
    return javascript_probe("json", blocks(source)["json"], mode).get("value", {})


class TemplateNodes(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.nodes = []
        self.stack = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        attributes["__parent_index"] = self.stack[-1] if self.stack else None
        self.nodes.append((tag, attributes))
        self.stack.append(len(self.nodes) - 1)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.stack.pop()

    def handle_endtag(self, tag):
        while self.stack:
            if self.nodes[self.stack.pop()][0] == tag:
                break


def compiled_nodes(source, mode="web"):
    template = template_for_mode(source, mode) or default_template(source)
    configuration = javascript_probe("json", blocks(source)["json"], mode)
    if configuration.get("error"):
        return None
    components = tuple(configuration.get("value", {}).get("usingComponents", {}))
    result = javascript_probe("template", template, mode, components)
    if result.get("error") or result.get("errors"):
        return None
    return TemplateNodes(result["template"]).nodes


def platform_node_isolated(source, tag):
    wx_nodes = compiled_nodes(source, "wx")
    web_nodes = compiled_nodes(source, "web")
    return (wx_nodes is not None and web_nodes is not None
            and any(name == tag for name, _ in wx_nodes)
            and not any(name == tag for name, _ in web_nodes))


def node_has_css(attrs, style, property_name, value):
    """Match CSS to a node's actual class, including comma-separated selectors."""
    classes = attrs.get("class", "") + " " + attrs.get(":class", "")
    for selectors, declarations in re.findall(r"([^{}]+)\{([^{}]*)\}", style):
        if re.search(rf"\b{re.escape(property_name)}\s*:\s*(?:{value})(?:\s*[;}}]|\s*$)", declarations):
            for name in re.findall(r"\.([\w-]+)", selectors):
                if re.search(rf"(?<![\w-]){re.escape(name)}(?![\w-])", classes):
                    return True
    return False


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
    body = method_body(page_script, "serverPrefetch") or method_body(page_script, "onServerPrefetch")
    return all_present(
        body,
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
    web_config = javascript_probe("config", config)
    style_page = home
    layout = read(root, "src/components/layout-cell.mpx")
    red = read(root, "src/components/red-card.mpx")
    blue = read(root, "src/components/blue-card.mpx")
    theme = read(root, "src/components/theme-card.mpx")
    red_scoped = bool(re.search(r"<style\b[^>]*\bscoped\b", red))
    blue_scoped = bool(re.search(r"<style\b[^>]*\bscoped\b", blue))
    layout_ok = (
        all_present(layout, r"virtualHost\s*:\s*true", r"flex\s*:\s*(?:1\b|1\s+1\s+0)")
        and all_present(style_page, r"\.equal-row\s*\{[^}]*display\s*:\s*flex", r"\.equal-row\s*\{[^}]*width\s*:\s*240px")
        and web_config.get("virtualHost") == [True, False]
        and not re.search(r"row-(?:group|list)\.mpx|row-(?:group|list)\\\.mpx", config)
    )
    external_ok = (
        all_present(theme, r"externalClasses\s*:\s*\[[^]]*tone-class[^]]*custom-class", r"class\s*=\s*['\"][^'\"]*tone-class[^'\"]*custom-class")
        and all_present(style_page, r"tone-class\s*=\s*['\"]warm-tone", r"tone-class\s*=\s*['\"]cool-tone", r"\.warm-tone\s*\{[^}]*color", r"\.cool-tone\s*\{[^}]*color", r"\.spaced-label\s*\{[^}]*padding\s*:\s*12px")
        and all(token in config for token in ("custom-class", "i-class", "tone-class"))
    )
    navigation = javascript_probe("navigation", blocks(home)["script"])
    navigation_ok = (
        all_present(home, r"<navigator\b[^>]*url\s*=\s*['\"]/pages/choice/index\?source=link['\"][^>]*open-type\s*=\s*['\"]navigate")
        and navigation.get("ready", False)
        and all_present(choice, r"query\.source", r"['\"]link['\"]", r"emit\(['\"]ready['\"]", r"confirm\s*\(\s*label\s*\)")
        and any(re.search(rf"emit\(['\"]{re.escape(event)}['\"]\s*,\s*label", choice)
                for event in navigation.get("confirmed", []))
    )
    capsule_guarded = "getMenuButtonBoundingClientRect" in home and (
        guarded_from_web(home, "getMenuButtonBoundingClientRect")
        or bool(re.search(r"if\s*\([^)]*__mpx_mode__\s*!={1,2}\s*['\"]web['\"]", home))
    )
    app_runtime = javascript_probe("script", blocks(app)["script"])
    navigation_bar_ok = (capsule_guarded and "navigationStyle" in app and "custom" in app
                         and app_runtime.get("webConfig", {}).get("enableTitleBar") is not True)
    route_ok = (
        web_config.get("value", {}).get("publicPath") == "/help-demo/"
        and app_runtime.get("webConfig", {}).get("routeConfig", {}).get("mode") == "history"
        and app_runtime.get("webConfig", {}).get("routeConfig", {}).get("base") == "/help-demo/"
        and all(page in json.dumps(effective_json(app, "web")) for page in ("pages/home/index", "pages/choice/index", "packageA"))
    )
    rpx_ok = web_config.get("samples") in (["0px", "14px", "100px", "-4px"], ["0", "14px", "100px", "-4px"])
    return assertion_rows(0, {
        "s0": red_scoped and blue_scoped,
        "s1": layout_ok,
        "s2": external_ok,
        "s3": navigation_ok,
        "s4": navigation_bar_ok,
        "s5": route_ok,
        "s6": rpx_ok,
    })


def check_eval_1(root):
    card = read(root, "profile-card.mpx")
    parts = blocks(card)
    script = parts["script"]
    component = javascript_probe("script", script)
    skeleton_ok = (
        all(parts.values())
        and component.get("constructor") == "component"
        and effective_json(card, "web").get("component") is True
        and not re.search(r"<script\b[^>]*\bsetup\b|\bsetup\s*\(", card)
    )
    external_ok = (
        bool(re.search(r"externalClasses\s*:\s*\[[^]]*accent-class", script))
        and "custom-class" in script
        and all_present(parts["template"], r"class\s*=\s*['\"][^'\"]*accent-class", r"\{\{\s*title\s*\}\}")
    )
    interaction_ok = (
        all_present(script, r"title\s*:", r"summary\s*:")
        and (component.get("data") or {}).get("expanded") is False
        and component_has_local_toggle(parts["template"], script, "expanded")
        and bool(re.search(r"wx:if\s*=\s*['\"]\{\{\s*expanded\s*\}\}['\"]", parts["template"]))
        and not re.search(r"\bthis\.setData\s*\(", script)
    )
    return assertion_rows(1, {"n0": skeleton_ok, "n2": external_ok, "n3": interaction_ok})


def wx_only_reference(source, marker):
    """Require every reference to be inside a branch selected only for wx."""
    references = list(re.finditer(re.escape(marker), source))
    ranges = []
    for branch in re.finditer(r"\bif\s*\(([^)]*)\)\s*\{", source):
        condition = branch.group(1)
        if (condition_matches_mode(condition, "wx", condition_variables(source, "wx")) is True
                and condition_matches_mode(condition, "web", condition_variables(source, "web")) is False):
            start = source.find("{", branch.start())
            ranges.append((start, start + len(extract_balanced_block(source, start))))
    return bool(references) and all(any(start <= ref.start() < end for start, end in ranges) for ref in references)


def share_isolated_for_web(page):
    script = blocks(page)["script"]
    share_data = all_present(script, r"onShareAppMessage", r"title\s*:\s*['\"]业务详情['\"]", r"path\s*:\s*['\"]/pages/business/index['\"]")
    share_removed = bool(re.search(r"implement\s*\(\s*['\"]onShareAppMessage['\"][\s\S]*?modes\s*:\s*\[[^]]*['\"]web['\"][^]]*\][\s\S]*?remove\s*:\s*true", script))
    boundary = bool(re.search(r"Web[^<\n]*(?:分享|未接入)|TODO\(web\)[^\n]*(?:分享|协议)", page, re.I))
    return share_data and (share_removed or wx_only_reference(script, "onShareAppMessage")) and boundary


def check_eval_2(root):
    content = read(root, "business-page.mpx")
    scan = video = store = catalog = content
    vendor = read(root, "native-scanner.mpx")
    input_vendor = read(WORKSPACE / "eval-2-api-component-adaptation/input", "native-scanner.mpx")
    content_blocks = blocks(content)
    scan_result_body = method_body(content_blocks["script"], "onScanResult")
    set_data_ok = (
        bool(scan_result_body)
        and "event.detail.result" in scan_result_body
        and bool(re.search(r"\bthis\.scanResult\s*=", scan_result_body))
        and not re.search(r"\bthis\.setData\s*\(", content_blocks["script"])
    )
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
            mode_guard(method_body(content_blocks["script"], "rename"), "wx")
            or mode_guard(method_body(content_blocks["script"], "rename"), "web")
            or handler_isolated_by_web_override(content, "rename")
        )
    )
    wx_components = effective_json(content, "wx").get("usingComponents", {})
    web_components = effective_json(content, "web").get("usingComponents", {})
    scanner_json_ok = (wx_components.get("native-scanner") == "./native-scanner.mpx"
                       and "native-scanner" not in web_components)
    scanner_template_ok = platform_node_isolated(scan, "native-scanner")
    scanner_ok = vendor == input_vendor and scanner_json_ok and scanner_template_ok and "TODO(web)" in scan and valid_mpx_conditionals(scan)
    video_probe = javascript_probe("video", content_blocks["script"])
    video_ok = all(video_probe.get(key, False) for key in ("srcMatches", "fallback", "detail")) and all_present(video, r"<video\b", r"src\s*=\s*['\"]\{\{src\}\}['\"]", r"bindtimeupdate", r"bindloadedmetadata") and all(has_safe_media_fallback(method_body(content_blocks["script"], handler)) for handler in ("onTimeUpdate", "onMetadata"))
    wx_location = javascript_probe("location", content_blocks["script"], "wx")
    web_location = javascript_probe("location", content_blocks["script"], "web")
    location_ok = (
        wx_location.get("calls") == ["chooseLocation"]
        and wx_location.get("placeName") == "probe-location"
        and web_location.get("calls") == []
        and bool(re.search(r"TODO\(web\)[^\n]*(?:位置|地图|选址)", content))
        and valid_mpx_conditionals(content_blocks["script"])
    )
    plugin_ok = (
        wx_components.get("foo-card") == "plugin://foo/component"
        and "foo-card" not in web_components
        and platform_node_isolated(content, "foo-card")
        and valid_mpx_conditionals(content_blocks["json"])
    )
    web_nodes = compiled_nodes(content) or []
    wx_nodes = compiled_nodes(content, "wx") or []
    web_picker = next((attrs for tag, attrs in web_nodes
                       if tag == "mpx-picker" and attrs.get("mode") == "selector"), {})
    picker_range = web_picker.get(":range", "")
    picker_value = web_picker.get(":value", "")
    region_web_ok = (
        (not web_picker and bool(re.search(r"TODO\(web\)[^\n]*(?:地区|行政区)", store)))
        or (bool(picker_range and picker_value)
            and "{{" not in str(web_picker)
            and "onWebRegionChange" in web_picker.get("@change", "")
            and all_present(store, r"regionOptions", r"onWebRegionChange", r"regionNames\s*=", r"regionCodes\s*=", r"regionText\s*="))
    )
    region_map_ok = (
        any(tag == "picker" and attrs.get("mode") == "region" for tag, attrs in wx_nodes)
        and platform_node_isolated(store, "map")
        and all_present(store, r"regionNames", r"regionCodes", r"regionText", r"mapCenter", r"storeMarkers", r"bindmarkertap", r"markerId", r"selectedStoreId", r"selectedStoreName", r"TODO\(web\)[^\n]*(?:地图|SDK)")
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
        not any(tag in {"grid-view", "grid-item", "page-container"} for tag, _ in web_nodes)
        and any("filteredProducts" in attrs.get("v-for", "")
                and attrs.get("__parent_index") is not None
                and node_has_css(web_nodes[attrs["__parent_index"]][1], content_blocks["style"], "display", "grid|flex")
                for tag, attrs in web_nodes)
        and any("filterVisible" in attrs.get("v-if", "")
                and node_has_css(attrs, content_blocks["style"], "position", "fixed")
                for tag, attrs in web_nodes)
        and all_present(str(web_nodes), r"filteredProducts", r"selectProduct", r"cancelFilter", r"confirmFilter")
    )
    structures_ok = (compiled_nodes(content) is not None and compiled_nodes(content, "wx") is not None
                     and structure_state and (structure_todo_boundary or structure_web_implementation)
                     and valid_mpx_conditionals(catalog))
    state_ok = javascript_probe("state", content_blocks["script"]).get("passed", False)
    rows = assertion_rows(2, {
        "c0": set_data_ok,
        "c1": edit_chain,
        "c2": scanner_ok,
        "c3": video_ok,
        "c4": location_ok,
        "c5": plugin_ok,
        "c6": region_map_ok,
        "c7": swiper_ok and image_ok,
        "c8": structures_ok,
        "c9": state_ok,
        "c10": share_isolated_for_web(content),
    })
    for row in rows:
        if row["id"] == "c3":
            row["evidence"] = "Actual Web router query and repository Web created/onLoad/media probes: " + json.dumps(video_probe, ensure_ascii=False)
        elif row["id"] == "c6":
            row["evidence"] = "Installed compiler's effective Web picker attributes: " + json.dumps(web_picker, ensure_ascii=False)
    return rows


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
        or all_present(page_script, r"import\s+(?:\w+|\{[^}]*useArticleStore[^}]*\})\s+from\s+['\"][^'\"]*store/article['\"]", r"useArticleStore\s*\(\s*this\.\$pinia\s*\)", r"loadArticle")
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
    browser_safe = all(javascript_probe("browser", source).get("unsafe") == []
                       for source in (app_script, page_script, store, service))
    wx_ok = javascript_probe("wxload", page_script, "wx").get("loaded", False) and all_present(page_script, r"onLoad\s*\(\s*query\s*\)", r"query(?:\s*&&\s*query)?\.id|query\.id", r"loadArticle\s*\(") and all_present(page, r"article\.title", r"article\.body", r"errorText", r"loading", r"expanded", r"toggleExtra") and all_present(store, r"this\.article\s*=", r"this\.loading\s*=", r"this\.errorText\s*=") and "createStore" not in page_script + store
    return assertion_rows(3, {
        "r0": preload_ok,
        "r1": pinia_ok,
        "r2": isolated_ok,
        "r3": browser_safe,
        "r4": wx_ok,
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


def paths(eval_id, group):
    item = next(item for item in load_config()["evals"] if item["id"] == eval_id)
    case = WORKSPACE / f"eval-{item['id']}-{item['name']}"
    run = case / group / "run-1"
    output = case / group / "outputs"
    return item, output, run


def grade_run(eval_id, group):
    item, output, run = paths(eval_id, group)
    missing = [name for name in item["outputs"] if not (output / name).is_file()]
    if missing:
        print(f"missing: {output}: {', '.join(missing)}", file=sys.stderr)
        return None
    results = CHECKERS[eval_id](output)
    enriched = [{**row, "evidence": row.get("evidence", "Calibrated source/compiled-template checks passed" if row["passed"] else "Calibrated source/compiled-template check failed; see semantic review for this assertion")} for row in results]
    passed = sum(row["passed"] for row in enriched)
    metrics, metric_errors = load_metrics(run)
    if metric_errors:
        print(f"metrics warning for eval-{eval_id} / {group} / run-1: {'; '.join(metric_errors)}", file=sys.stderr)
    summary = {"pass_rate": round(passed / len(enriched), 4), "passed": passed, "failed": len(enriched) - passed, "total": len(enriched)}
    if metrics:
        summary.update(metrics)
    grading = {
        "eval_id": eval_id,
        "run_kind": group,
        "grading_method": "calibrated-source-compiler-behavior-v1",
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
    args = parser.parse_args()
    ids = sorted(CHECKERS) if args.evals is None else args.evals
    groups = GROUPS if args.groups is None else args.groups
    if not ids or set(ids) - set(CHECKERS):
        parser.error("unknown or empty eval ids")
    if not groups:
        parser.error("groups must be non-empty")
    rows = []
    for eval_id in ids:
        for group in groups:
            grading = grade_run(eval_id, group)
            if grading:
                summary = grading["summary"]
                rows.append({"eval": eval_id, "kind": group, "score": f"{summary['passed']}/{summary['total']}"})
    print(json.dumps(rows, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
