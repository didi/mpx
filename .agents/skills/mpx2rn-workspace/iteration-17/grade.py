#!/usr/bin/env python3
"""Grade outputs: mpx2rn, mpx2rn-simple, and no_skill on iteration-17."""
import ast
import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent
RN_MODES = ("ios",)
ORIGINAL_MODES = ("wx",)
ALL_MODES = ORIGINAL_MODES + RN_MODES

# ─── Shared helpers ───────────────────────────────────────────────────────────

def extract_blocks(src: str):
    blocks = {"template": "", "script": "", "style": "", "json": ""}
    def grab_all(tag):
        return re.findall(
            rf"<{tag}(?:\s[^>]*)?>(.*?)</{tag}>", src, re.DOTALL | re.IGNORECASE)
    blocks["template"] = "\n".join(grab_all("template"))
    blocks["style"] = "\n".join(grab_all("style"))
    for m in re.finditer(
        r"<script(?P<attrs>(?:\s[^>]*)?)>(?P<body>.*?)</script>",
        src, re.DOTALL | re.IGNORECASE):
        attrs = (m.group("attrs") or "").lower()
        body = m.group("body")
        if 'type="application/json"' in attrs or 'name="json"' in attrs:
            blocks["json"] += "\n" + body
        else:
            blocks["script"] += "\n" + body
    return blocks


def strip_comments(text):
    return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)


def style_condition_matches_mode(condition, mode, variables=None):
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
            if node.id in {"wx", "ali", "web", "ios", "android", "harmony"}:
                return node.id == mode
        if isinstance(node, ast.Constant) and isinstance(
                node.value, (bool, str)):
            return node.value
        raise ValueError

    try:
        return bool(evaluate(ast.parse(expression, mode="eval")))
    except (SyntaxError, ValueError):
        return None


def condition_variables(source, mode):
    """Resolve simple boolean aliases used by platform guard conditions."""
    assignments = re.findall(
        r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)",
        strip_comments(source),
    )
    variables = {}
    unresolved = assignments
    while unresolved:
        next_unresolved = []
        for name, expression in unresolved:
            value = style_condition_matches_mode(expression, mode, variables)
            if value is None:
                next_unresolved.append((name, expression))
            else:
                variables[name] = value
        if len(next_unresolved) == len(unresolved):
            break
        unresolved = next_unresolved
    return variables


def has_checked_platform_branch(source):
    """Detect branches that produce different results for wx and iOS."""
    if re.search(r"@_?mode\b|@(ios|wx)\b", source):
        return True

    conditions = re.findall(
        r"/\*\s*@mpx-(?:if|elif)\b(.*?)\*/",
        source,
        re.DOTALL | re.IGNORECASE,
    )
    conditions.extend(re.findall(r"\bif\s*\((.*?)\)\s*\{", source, re.DOTALL))
    variables_by_mode = {
        mode: condition_variables(source, mode)
        for mode in ALL_MODES
    }
    for condition in conditions:
        matches = [
            style_condition_matches_mode(
                condition, mode, variables_by_mode[mode])
            for mode in ALL_MODES
        ]
        if all(value is not None for value in matches):
            if len(set(matches)) > 1:
                return True
        elif "__mpx_mode__" in condition or re.search(
                r"\b(?:ios|wx)\b", condition):
            return True
    return False


def resolve_style_conditionals(text, mode):
    block_pattern = re.compile(
        r"/\*\s*@mpx-if\b(?P<condition>.*?)\*/"
        r"(?P<body>(?:(?!/\*\s*@mpx-if\b).)*?)"
        r"/\*\s*@mpx-(?:endif|end-if)\s*\*/",
        re.DOTALL | re.IGNORECASE,
    )
    branch_pattern = re.compile(
        r"/\*\s*@mpx-(?P<kind>elif|else)\b(?P<condition>.*?)\*/",
        re.DOTALL | re.IGNORECASE,
    )

    def select_branch(match):
        condition = match.group("condition")
        body = match.group("body")
        start = 0
        for branch in branch_pattern.finditer(body):
            matches = style_condition_matches_mode(condition, mode)
            if matches is None:
                return body
            if matches:
                return body[start:branch.start()]
            condition = branch.group("condition") if branch.group("kind").lower() == "elif" else None
            start = branch.end()
        matches = condition is None or style_condition_matches_mode(condition, mode)
        if matches is None:
            return body
        if matches:
            return body[start:]
        return ""

    while True:
        text, count = block_pattern.subn(select_branch, text)
        if not count:
            return text


def resolve_clean_styles(text, modes=RN_MODES):
    return [
        strip_comments(resolve_style_conditionals(text, mode))
        for mode in modes
    ]


def strip_at_rules(text):
    result = re.sub(r"@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}", "", text, flags=re.DOTALL)
    result = re.sub(r"@media\s[^{]*\{[^}]*(?:\{[^}]*\}[^}]*)*\}", "", result, flags=re.DOTALL)
    return result


def has_less_nesting(style_text):
    text = strip_comments(style_text)
    text = strip_at_rules(text)
    if "&" in text:
        return True
    depth = 0
    for i, c in enumerate(text):
        if c == "{": depth += 1
        elif c == "}": depth -= 1
        elif depth >= 1 and c == "\n":
            j = i + 1
            while j < len(text) and text[j] in " \t": j += 1
            if j < len(text) and text[j] not in "}{\n":
                k = j
                while k < len(text) and text[k] not in "{};": k += 1
                if k < len(text) and text[k] == "{":
                    return True
    return False


def has_empty_rules(style_text):
    text = strip_comments(style_text)
    return bool(re.search(r"[^{}]+\{\s*\}", text))


def has_bad_wx_style_keys(template_text):
    """Check for quoted or kebab-case keys in wx:style object literals."""
    wx_style_exprs = re.findall(r'wx:style\s*=\s*"([^"]*)"', template_text)
    for expr in wx_style_exprs:
        if re.search(r"""['"]\s*[a-zA-Z][\w-]*\s*['"]\s*:""", expr):
            return True
        if re.search(r'[a-zA-Z][\w]*-[\w-]*\s*:', expr):
            return True
    return False


def has_wx_class_object_key(template_text, key):
    """Check for an exact quoted key in wx:class object literals."""
    wx_class_exprs = re.findall(r'wx:class\s*=\s*"([^"]*)"', template_text)
    key_pattern = re.compile(rf"['\"]{re.escape(key)}['\"]\s*:")
    return any(key_pattern.search(expr) for expr in wx_class_exprs)


def uses_wrong_endif(text):
    return "@mpx-end-if" in text


def platform_attribute_pattern(name, mode):
    """Match an attribute whose platform suffix includes the checked mode."""
    platform = r"[A-Za-z0-9_-]+"
    return (rf"{re.escape(name)}@(?:{platform}\|)*{re.escape(mode)}"
            rf"(?:\|{platform})*")


def extract_balanced_object(source, start):
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


def conditional_branch_spans(source, branch_matches_rn):
    spans = []
    variables_by_mode = {
        mode: condition_variables(source, mode)
        for mode in RN_MODES
    }
    for match in re.finditer(r"\bif\s*\((.*?)\)\s*\{", source, re.DOTALL):
        condition = match.group(1)
        matches = [
            style_condition_matches_mode(
                condition, mode, variables_by_mode[mode])
            for mode in RN_MODES
        ]
        if any(value is None for value in matches):
            continue
        block_start = source.find("{", match.start())
        block = extract_balanced_object(source, block_start)
        if not block:
            continue
        block_end = block_start + len(block)
        if all(value is branch_matches_rn for value in matches):
            spans.append((block_start + 1, block_end - 1))
        else_match = re.match(r"\s*else\s*\{", source[block_end:])
        if else_match and all(value is not branch_matches_rn for value in matches):
            else_start = source.find("{", block_end, block_end + else_match.end())
            else_block = extract_balanced_object(source, else_start)
            spans.append((else_start + 1, else_start + len(else_block) - 1))
    return spans


def occurrences_are_non_rn_guarded(source, pattern):
    occurrences = list(re.finditer(pattern, source))
    if not occurrences:
        return True
    spans = conditional_branch_spans(source, False)
    return all(any(start <= match.start() < end for start, end in spans)
               for match in occurrences)


def function_spans(source):
    spans = []
    patterns = (
        r"\b(?P<name>[A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{",
        r"\b(?P<name>[A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?"
        r"\([^)]*\)\s*=>\s*\{",
    )
    for pattern in patterns:
        for match in re.finditer(pattern, source):
            name = match.group("name")
            if name in {"if", "for", "switch", "while"}:
                continue
            block_start = source.find("{", match.start())
            block = extract_balanced_object(source, block_start)
            if block:
                spans.append({
                    "name": name,
                    "name_start": match.start("name"),
                    "start": block_start + 1,
                    "end": block_start + len(block) - 1,
                })
    return spans


def rn_early_return_precedes(source, position, scope):
    for start, end in conditional_branch_spans(source, True):
        if (scope["start"] <= start and end < position
                and re.search(r"\breturn\b", source[start:end])):
            return True
    prefix = source[scope["start"]:position]
    return any(all(style_condition_matches_mode(
                       match.group(1), mode,
                       condition_variables(source, mode)) is True
                   for mode in RN_MODES)
               for match in re.finditer(
                   r"\bif\s*\((.*?)\)\s*return\b", prefix, re.DOTALL))


def occurrences_are_rn_unreachable(source, pattern):
    occurrences = list(re.finditer(pattern, source))
    if not occurrences:
        return True
    non_rn_spans = conditional_branch_spans(source, False)
    functions = function_spans(source)

    def unreachable(position, seen):
        if any(start <= position < end for start, end in non_rn_spans):
            return True
        scopes = [
            function for function in functions
            if function["start"] <= position < function["end"]
        ]
        if not scopes:
            return False
        scope = max(scopes, key=lambda function: function["start"])
        if rn_early_return_precedes(source, position, scope):
            return True
        scope_key = (scope["start"], scope["end"])
        if scope_key in seen:
            return False
        calls = [
            match for match in re.finditer(
                rf"(?:\bthis\s*\.\s*)?\b{re.escape(scope['name'])}\s*\(",
                source)
            if match.start() != scope["name_start"]
        ]
        return bool(calls) and all(
            unreachable(match.start(), seen | {scope_key}) for match in calls)

    return all(unreachable(match.start(), set()) for match in occurrences)


def extract_object_call(source, name):
    match = re.search(rf"\b{re.escape(name)}\s*\(\s*\{{", source)
    return extract_balanced_object(source, source.find("{", match.start())) if match else ""


def extract_named_object(source, name):
    match = re.search(rf"\b{re.escape(name)}\s*:\s*\{{", source)
    return extract_balanced_object(source, source.find("{", match.start())) if match else ""


def extract_data_option(source):
    data_object = extract_named_object(source, "data")
    if data_object:
        return data_object
    match = re.search(r"\bdata\s*\([^)]*\)\s*\{.*?\breturn\s*\{", source, re.DOTALL)
    return extract_balanced_object(source, source.rfind("{", match.start(), match.end())) if match else ""


def has_unsupported_selector(style_text):
    for selector_group in re.findall(r"([^{}]+)\{", strip_comments(style_text)):
        selector_group = selector_group.strip()
        if selector_group.startswith("@"):
            continue
        for selector in selector_group.split(","):
            if not re.fullmatch(r"(?:\.[A-Za-z_][\w-]*|page|:host)", selector.strip()):
                return True
    return False


def uses_regular_classes(template, style):
    style_classes = set(re.findall(r"\.([A-Za-z_][\w-]*)\s*(?=[,{])", strip_comments(style)))
    template_classes = set()
    for value in re.findall(r'(?<![-:\w])class\s*=\s*"([^"]+)"', template):
        template_classes.update(value.split())
    return bool(style_classes.intersection(template_classes))


def has_atomic_utility_class(template):
    return bool(re.search(
        r"(?:^|[\s'\"])(?:flex(?:-(?:row|col|wrap|1))?|items-[\w-]+|"
        r"justify-[\w-]+|gap-[\w.\[\]-]+|[mp][trblxy]?-[\w.\[\]-]+|"
        r"bg-[\w#\[\]-]+(?:/\d+)?|text-(?:xs|sm|base|lg|xl|\d+|[\w-]+/\d+)|"
        r"rounded(?:-[\w.\[\]-]+)?|w-[\w.\[\]-]+|h-[\w.\[\]-]+)"
        r"(?=$|[\s'\"])",
        template,
    ))


def extract_css_declarations(body):
    return {
        prop.lower(): re.sub(r"\s+", "", value).lower()
        for prop, value in re.findall(r"([\w-]+)\s*:\s*([^;{}]+)", strip_comments(body))
    }


def has_pseudo_view_replacement(input_style, output_template, output_style):
    """Match a pseudo element's visual signature to a styled real view node."""
    view_classes = set()
    for classes in re.findall(r'<view\b[^>]*\bclass\s*=\s*"([^"]+)"', output_template):
        view_classes.update(classes.split())

    class_declarations = {
        name: extract_css_declarations(body)
        for name, body in re.findall(
            r"\.([A-Za-z_][\w-]*)\s*\{([^{}]*)\}", output_style)
        if name in view_classes
    }
    for pseudo_body in re.findall(
            r"[^{}]*:{1,2}(?:before|after)\s*\{([^{}]*)\}", input_style,
            re.DOTALL | re.IGNORECASE):
        pseudo_declarations = extract_css_declarations(pseudo_body)
        pseudo_background = pseudo_declarations.get(
            "background-image", pseudo_declarations.get("background"))
        pseudo_dimensions = {
            prop: pseudo_declarations[prop]
            for prop in ("width", "height")
            if prop in pseudo_declarations
        }
        if not pseudo_background or not pseudo_dimensions:
            continue
        for declarations in class_declarations.values():
            background = declarations.get(
                "background-image", declarations.get("background"))
            if background == pseudo_background and any(
                    declarations.get(prop) == value
                    for prop, value in pseudo_dimensions.items()):
                return True
    return False


# ─── eval-0: style-adaptation ────────────────────────────────────────────────

def check_eval_0(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    input_blocks = extract_blocks(
        (output_path.parents[2] / "input" / output_path.name).read_text())
    styles_rn_clean = resolve_clean_styles(blocks["style"])
    style_rn_clean = "\n".join(styles_rn_clean)

    results = [
        {"id": "s0", "text": "样式：RN 端不包含后代选择器（如 .parent .child）",
         "passed": not re.search(r"\.\w[\w-]*\s+\.\w[\w-]*", style_rn_clean)},

        {"id": "s1", "text": "样式：RN 端不使用 display: grid，改为 Flex 布局",
         "passed": not re.search(r"display\s*:\s*grid", style_rn_clean)},

        {"id": "s2", "text": "样式：RN 端不包含 ::before 伪元素",
         "passed": "::before" not in style_rn_clean and ":before" not in style_rn_clean},

        {"id": "s3", "text": "样式：RN 端不包含 :active 伪类，改用 hover-class",
         "passed": ":active" not in style_rn_clean},

        {"id": "s4", "text": "样式：RN 端不包含 :first-child 伪类",
         "passed": ":first-child" not in style_rn_clean},

        {"id": "s5", "text": "样式：RN 端不包含 + 相邻兄弟选择器",
         "passed": not re.search(r"\.[\w-]+\s*\+\s*\.[\w-]+", style_rn_clean)},

        {"id": "s6", "text": "样式：数值型 font-weight（500/600）替换为 bold/normal",
         "passed": not re.search(r"font-weight\s*:\s*[1-9]\d{2}", style_rn_clean)},

        {"id": "s7", "text": "样式：text-overflow/white-space 使用双轨适配，RN 端使用 numberOfLines",
         "passed": "numberOfLines" in blocks["template"]},

        {"id": "s8", "text": "模板：使用真实节点替代 ::before 伪元素",
         "passed": has_pseudo_view_replacement(
             input_blocks["style"], blocks["template"], style_rn_clean)},

        {"id": "s9", "text": "样式：条件编译结束标记使用 @mpx-endif，不使用 @mpx-end-if",
         "passed": not uses_wrong_endif(src)},

        {"id": "s10", "text": "样式：移除注释后不存在空选择器规则",
         "passed": not any(has_empty_rules(style)
                           for style in resolve_clean_styles(
                               blocks["style"], ALL_MODES))},

        {"id": "s11", "text": "样式：RN 端不包含 > 子选择器",
         "passed": not re.search(r"\.[\w-]+\s*>\s*\.[\w-]+", style_rn_clean)},

        {"id": "s12", "text": "样式：RN 端不包含 .a.b 多类选择器",
         "passed": not re.search(r"\.[\w-]+\.[\w-]+", style_rn_clean)},

        {"id": "s13", "text": "样式：RN 端 tag-highlight 场景不包含 + 相邻兄弟选择器",
         "passed": not re.search(r"\.[\w-]+\s*\+\s*\.[\w-]+", style_rn_clean)},

        {"id": "s14", "text": "模板：wx:class 对象键保留横杆类名 tag-highlight，不转换为 tagHighlight",
         "passed": has_wx_class_object_key(blocks["template"], "tag-highlight")
                   and not has_wx_class_object_key(blocks["template"], "tagHighlight")},
    ]
    return results


# ─── eval-1: template-adaptation ─────────────────────────────────────────────

def check_eval_1(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn_clean = "\n".join(resolve_clean_styles(blocks["style"]))

    def view_tag_with_class(class_name):
        for tag in re.findall(r"<view\b[^>]*>", blocks["template"], re.DOTALL):
            class_match = re.search(
                r'(?<![:\w-])class\s*=\s*["\']([^"\']*)', tag)
            if class_match and class_name in class_match.group(1).split():
                return tag
        return ""

    primary_tag = view_tag_with_class("btn-primary")
    default_tag = view_tag_with_class("btn-default")
    key_pattern = (
        rf'(?<![:\w-])(?:{platform_attribute_pattern("key", "ios")}|key)'
        r'\s*=\s*["\']([^"\']+)')
    primary_key = re.search(key_pattern, primary_tag)
    default_key = re.search(key_pattern, default_tag)
    has_distinct_keys = bool(
        primary_key and default_key
        and primary_key.group(1) != default_key.group(1))

    def has_enabled_hover(tag):
        hover_class = re.search(
            r'\bhover-class\s*=\s*["\']([^"\']+)', tag)
        return bool(hover_class and hover_class.group(1) != "none")

    conditional_hover_handled = (
        has_distinct_keys
        or (has_enabled_hover(primary_tag) and has_enabled_hover(default_tag)))

    results = [
        {"id": "t0", "text": "模板：动态类名使用 wx:class，不在 class 属性中插值",
         "passed": not re.search(r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"', blocks["template"])},

        {"id": "t1", "text": "模板：事件参数使用内联传参，不使用 data- 属性",
         "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])},

        {"id": "t2", "text": "模板：Mustache 中不调用普通方法，getStatusColor/getStatusText 改为 computed 或 wx:style 绑定",
         "passed": not re.search(r'\{\{[^}]*\b\w+\s*\([^)]*\)', blocks["template"])},

        {"id": "t3", "text": "模板：页面滚动改用 scroll-view，移除 onPullDownRefresh/onReachBottom",
         "passed": "scroll-view" in blocks["template"]},

        {"id": "t4", "text": "模板：scroll-view 声明 bindscrolltolower 或等效滚动事件",
         "passed": "bindscrolltolower" in blocks["template"]
                   or "bindscroll" in blocks["template"]
                   or "scroll-view" in blocks["template"]},

        {"id": "t5", "text": "脚本：所有 wx.xxx API 替换为 mpx.xxx",
         "passed": not re.search(r"\bwx\.(navigateTo|showActionSheet|showModal|request)", blocks["script"])
                   and "mpx." in blocks["script"]},

        {"id": "t6", "text": "脚本：不使用 e.target.dataset，事件参数改为内联传递",
         "passed": "e.target.dataset" not in blocks["script"]
                   and "e.currentTarget.dataset" not in blocks["script"]},

        {"id": "t7", "text": "样式：RN 端不包含 .btn-default .btn-text 复合选择器",
         "passed": not re.search(r"\.btn-default\s+\.btn-text", style_rn_clean)},

        {"id": "t8", "text": "模板：wx:style 对象键使用不加引号的驼峰写法，不使用引号或横杆写法",
         "passed": not has_bad_wx_style_keys(blocks["template"])},

        {"id": "t9", "text": "模板：Hover 能力不同的相邻条件分支使用不同的有效 key，或让两个分支始终存在有效 hover-class",
         "passed": conditional_hover_handled},
    ]
    return results


# ─── eval-2: script-json-adaptation ──────────────────────────────────────────

def check_eval_2(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)

    # Check wx.xxx replacement. Direct host APIs are not accepted merely because
    # an unrelated __mpx_mode__ condition exists elsewhere in the script.
    wx_apis = ["wx.getStorageSync", "wx.setStorageSync", "wx.removeStorageSync",
               "wx.navigateTo", "wx.showModal", "wx.showToast", "wx.reLaunch",
               "wx.request", "wx.getLocation"]
    script_text = blocks["script"]
    has_any_wx = any(api in script_text for api in wx_apis)
    has_mpx = "mpx." in script_text
    wx_ok = not has_any_wx and has_mpx

    # Check RN-unsupported lifecycles
    script_rn = blocks["script"]

    def _is_lifecycle_isolated(name, script_text):
        """Check if a lifecycle hook is removed or isolated via conditional compile."""
        return occurrences_are_non_rn_guarded(
            script_text, rf"\b{re.escape(name)}\s*\(")

    share_timeline_ok = _is_lifecycle_isolated("onShareTimeline", script_rn)
    tab_item_tap_ok = _is_lifecycle_isolated("onTabItemTap", script_rn)

    # setTabBarBadge/removeTabBarBadge
    has_tabbar_badge = "setTabBarBadge" in script_rn or "removeTabBarBadge" in script_rn
    tabbar_badge_ok = (
        not has_tabbar_badge
        or occurrences_are_rn_unreachable(
            script_rn, r"\b(?:setTabBarBadge|removeTabBarBadge)\s*\(")
    )

    # getUserProfile
    has_get_user_profile = "getUserProfile" in script_rn
    get_user_profile_ok = (
        not has_get_user_profile
        or occurrences_are_rn_unreachable(
            script_rn, r"\bgetUserProfile\s*\(")
    )

    # enablePullDownRefresh in RN context
    has_pull_down_json = "enablePullDownRefresh" in blocks["json"]
    pull_down_handled = (
        not has_pull_down_json
        or occurrences_are_non_rn_guarded(
            blocks["json"], r"\benablePullDownRefresh\b")
        or "scroll-view" in blocks["template"]
    )

    results = [
        {"id": "j0", "text": "脚本：request/navigateTo/showModal/getStorageSync/setStorageSync/removeStorageSync/showToast/reLaunch 等 wx.xxx API 全部替换为 mpx.xxx",
         "passed": wx_ok},

        {"id": "j1", "text": "脚本：移除 onShareTimeline 或使用条件编译隔离（RN 不支持）",
         "passed": share_timeline_ok},

        {"id": "j2", "text": "脚本：移除 onTabItemTap 或使用条件编译隔离（RN 不支持）",
         "passed": tab_item_tap_ok},

        {"id": "j3", "text": "脚本：使用条件编译隔离 setTabBarBadge/removeTabBarBadge（RN 不支持）",
         "passed": tabbar_badge_ok},

        {"id": "j4", "text": "脚本：隔离或替换 wx.getUserProfile（RN 不支持）",
         "passed": get_user_profile_ok},

        {"id": "j5", "text": "脚本：不使用 e.target.dataset，事件参数改为内联传递或使用 e.currentTarget.dataset",
         "passed": "e.target.dataset" not in blocks["script"]},

        {"id": "j7", "text": "JSON：针对 RN 处理 enablePullDownRefresh（RN 页面默认不可滚动）",
         "passed": pull_down_handled},

        {"id": "j8", "text": "模板：移除 data- 属性并使用事件内联传参",
         "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])},

        {"id": "j9", "text": "脚本：保留 RN 支持的 onShareAppMessage，不应删除",
         "passed": "onShareAppMessage" in blocks["script"]},
    ]
    return results


# ─── eval-3: gradient-animation-interaction ─────────────────────────────────

def check_eval_3(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn_clean = "\n".join(resolve_clean_styles(blocks["style"]))

    def view_tag_with_class(class_name):
        for tag in re.findall(r"<view\b[^>]*>", blocks["template"], re.DOTALL):
            class_match = re.search(
                r'(?<![:\w-])class\s*=\s*["\']([^"\']*)', tag)
            if class_match and class_name in class_match.group(1).split():
                return tag
        return ""

    # g0: no transparent in linear-gradient (should be rgba form)
    gradient_matches = re.findall(r"linear-gradient\([^)]*\)", style_rn_clean)
    has_transparent_in_gradient = any("transparent" in g for g in gradient_matches)

    # g1: no display: none in RN style
    has_display_none = bool(re.search(r"display\s*:\s*none", style_rn_clean))

    # g2: no transition-property: all or transition: all
    has_transition_all = bool(re.search(
        r"transition(-property)?\s*:[^;]*\ball\b", style_rn_clean))

    # g3: dynamic background node predeclares the capability on iOS only
    gradient_tag = view_tag_with_class("gradient-overlay")
    has_enable_background = bool(re.search(
        rf"\b{platform_attribute_pattern('enable-background', 'ios')}\s*=",
        gradient_tag))

    # g4: dynamic transition node predeclares the capability on iOS only
    card_item_tag = view_tag_with_class("card-item")
    has_enable_animation = bool(re.search(
        rf"\b{platform_attribute_pattern('enable-animation', 'ios')}\s*=",
        card_item_tag))

    # g5: no lifecycle hooks inside setTimeout/Promise.then
    # Check for pattern: setTimeout/Promise.then containing onMounted/onShow/onHide etc
    has_async_lifecycle = bool(re.search(
        r"(setTimeout|Promise\.then|\.then)\s*\([^)]*\{[^}]*(onMounted|onShow|onHide|onBeforeMount|onUnmounted)",
        blocks["script"], re.DOTALL)) or bool(re.search(
        r"setTimeout\s*\(\s*(\(\)\s*=>|function)\s*\{[^}]*(onMounted|onShow|onHide)",
        blocks["script"], re.DOTALL))

    # g6: createIntersectionObserver relativeTo uses simple selector (no compound/descendant)
    has_compound_relative_to = bool(re.search(
        r'relativeTo\s*\(\s*[\'"][^\'"]*\s+[^\'"]*[\'"]', blocks["script"]))
    relative_to_simple = not has_compound_relative_to

    # g7: uses <script name="json"> (needed to enable platform conditional logic)
    # If the JSON block has no platform-specific fields needing conditional compile,
    # then <script type="application/json"> is also acceptable
    has_script_name_json = bool(re.search(
        r'<script\s+name\s*=\s*["\']json["\']', src))
    json_needs_conditional = bool(re.search(
        r"(disableScroll|enablePullDownRefresh|onReachBottomDistance|backgroundTextStyle)",
        blocks["json"]))
    json_format_ok = has_script_name_json or not json_needs_conditional

    # g8: no opacity:0 on elements with bindtap/bindlongpress
    # Find elements with both opacity style and tap events
    tap_elements_with_opacity = re.findall(
        r'<view[^>]*(bindtap|bindlongpress)[^>]*class\s*=\s*"([^"]*)"[^>]*>',
        blocks["template"])
    tap_classes = [m[1].split() for m in tap_elements_with_opacity]
    has_opacity_zero_tap = False
    for class_list in tap_classes:
        for cls in class_list:
            cls_pattern = re.escape(cls)
            rule_match = re.search(
                rf"\.{cls_pattern}\s*\{{[^}}]*opacity\s*:\s*0[^1-9][^}}]*\}}",
                style_rn_clean)
            if rule_match:
                has_opacity_zero_tap = True
                break
    # Also check inline: elements with bindtap and style containing opacity:0
    inline_opacity_tap = bool(re.search(
        r'<[^>]*(bindtap|bindlongpress)[^>]*style\s*=\s*"[^"]*opacity\s*:\s*0[^"]*"',
        blocks["template"]))
    # Check the toast-mask pattern from input (class with opacity:0 and bindtap)
    toast_mask_opacity = bool(re.search(
        r'opacity\s*:\s*0\s*;?\s*\}', style_rn_clean)) and bool(re.search(
        r'(bindtap|bindlongpress).*class\s*=\s*"[^"]*toast-mask|class\s*=\s*"[^"]*toast-mask[^"]*"[^>]*(bindtap|bindlongpress)',
        blocks["template"]))
    opacity_tap_ok = not has_opacity_zero_tap and not inline_opacity_tap and not toast_mask_opacity

    # g9: @keyframes conditionally compiled or removed from RN
    # Check whether @keyframes is present in the resolved iOS style.
    has_keyframes_in_rn = bool(re.search(r"@keyframes", style_rn_clean))

    # g10: conditional branches with different CSS variable capabilities either
    # avoid reuse with distinct RN-only keys or predeclare enable-var on both.
    toast_tag = view_tag_with_class("toast-mask")
    placeholder_tag = view_tag_with_class("toast-placeholder")
    toast_key = re.search(
        rf'\b{platform_attribute_pattern("key", "ios")}\s*=\s*["\']([^"\']+)',
        toast_tag)
    placeholder_key = re.search(
        rf'\b{platform_attribute_pattern("key", "ios")}\s*=\s*["\']([^"\']+)',
        placeholder_tag)
    conditional_css_var_keys_ok = bool(
        toast_key and placeholder_key
        and toast_key.group(1) != placeholder_key.group(1))
    enable_var_pattern = re.compile(
        rf'\b{platform_attribute_pattern("enable-var", "ios")}\s*=\s*["\']'
        r'(?:\{\{\s*true\s*\}\}|true)["\']')
    conditional_css_var_predeclared = bool(
        enable_var_pattern.search(toast_tag)
        and enable_var_pattern.search(placeholder_tag))
    conditional_css_var_handled = (
        conditional_css_var_keys_ok or conditional_css_var_predeclared)

    results = [
        {"id": "g0", "text": "样式：linear-gradient 中的 transparent 替换为目标颜色的 rgba 形式",
         "passed": not has_transparent_in_gradient},

        {"id": "g1", "text": "样式：display:none 替换为 width:0;height:0;overflow:hidden 或 wx:if",
         "passed": not has_display_none},

        {"id": "g2", "text": "样式：transition-property:all 替换为具体属性名",
         "passed": not has_transition_all},

        {"id": "g3", "text": "模板：动态 background-image 所在的 view 使用 RN 属性条件编译添加 enable-background",
         "passed": has_enable_background},

        {"id": "g4", "text": "模板：动态 transition 所在的 view 使用 RN 属性条件编译添加 enable-animation",
         "passed": has_enable_animation},

        {"id": "g5", "text": "脚本：生命周期钩子在 setup 中同步注册，不在异步回调中注册",
         "passed": not has_async_lifecycle},

        {"id": "g6", "text": "脚本：relativeTo 使用简单选择器，不使用复合或后代选择器",
         "passed": relative_to_simple},

        {"id": "g7", "text": "JSON：条件编译配置使用 script name=\"json\" 格式",
         "passed": json_format_ok},

        {"id": "g8", "text": "样式：带 bindtap 的元素不设置 opacity:0，避免 iOS 事件失效",
         "passed": opacity_tap_ok},

        {"id": "g9", "text": "样式：@keyframes 通过条件编译限制在非 RN 平台，或替换为 transition",
         "passed": not has_keyframes_in_rn},

        {"id": "g10", "text": "模板：CSS 变量能力不同的相邻条件分支使用不同的 RN key，或在两个分支都用 RN enable-var 预声明保持能力稳定",
         "passed": conditional_css_var_handled},
    ]
    return results


# ─── eval-4: text-layout-selector ───────────────────────────────────────────

def check_eval_4(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn_clean = "\n".join(resolve_clean_styles(blocks["style"]))

    # l1: no position: sticky in RN style and sticky-header is used instead
    has_position_sticky = bool(re.search(r"position\s*:\s*sticky", style_rn_clean))
    has_sticky_header = bool(re.search(
        rf"<sticky-header(?:\s|>)|\b{platform_attribute_pattern('mpxTagName', 'ios')}"
        r"\s*=\s*['\"]sticky-header['\"]",
        blocks["template"]))

    # l2: /*use rpx*/ or /*use px*/ comments preserved
    has_unit_comments = bool(re.search(r"/\*\s*use\s+(rpx|px)\s*\*/", blocks["style"]))

    # l3: no background-image on .title class (text element)
    # Check if .title rule has background-image in RN style
    title_rules = re.findall(r"\.title\s*\{([^}]*)\}", style_rn_clean)
    has_bg_on_title = any("background-image" in rule for rule in title_rules)

    # l5: wx:ref on actual scroll-into-view target elements
    scroll_targets = []
    for value in re.findall(
            r'\bscroll-into-view\s*=\s*"([^"]*)"', blocks["template"]):
        binding = re.fullmatch(
            r'([^{}]*)\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}([^{}]*)', value)
        if binding:
            prefix, target_var, suffix = binding.groups()
            scroll_targets.extend(
                prefix + target + suffix
                for target in re.findall(
                    rf'\b{re.escape(target_var)}\.value\s*=\s*[\'"]([^\'"]+)',
                    blocks["script"])
                if target
            )
        elif value:
            scroll_targets.append(value)
    has_wxref_on_scroll_targets = all(
        bool(re.search(rf'id="{re.escape(t)}"[^>]*wx:ref|wx:ref[^>]*id="{re.escape(t)}"',
                       blocks["template"]))
        for t in scroll_targets
    ) if scroll_targets else False

    # l6: wx:ref on createSelectorQuery target elements
    # Check if #chart (the selector target) has wx:ref in template
    selector_targets = re.findall(
        r'(?:select|observe|relativeTo)\s*\(\s*[\'"]([#.][^"\']+)[\'"]',
        blocks["script"])
    has_wxref_on_query_targets = True
    for sel in selector_targets:
        if sel.startswith("#"):
            id_val = sel[1:]
            if not re.search(
                rf'id="{re.escape(id_val)}"[^>]*wx:ref|wx:ref[^>]*id="{re.escape(id_val)}"',
                blocks["template"]):
                has_wxref_on_query_targets = False
                break
        elif sel.startswith("."):
            cls_val = sel[1:]
            if not re.search(
                rf'class="[^"]*{re.escape(cls_val)}[^"]*"[^>]*wx:ref|wx:ref[^>]*class="[^"]*{re.escape(cls_val)}',
                blocks["template"]):
                has_wxref_on_query_targets = False
                break

    # l7: no compound/descendant selector in selectComponent/createSelectorQuery calls
    has_compound_selector = bool(re.search(
        r'(?:select|selectComponent|selectAllComponents|observe|relativeTo)\s*\(\s*[\'"][^"\']*\s+[^"\']*[\'"]',
        blocks["script"]))

    # l8: no catch prefix on non-touch events
    touch_events = {"tap", "longpress", "touchstart", "touchmove", "touchend", "touchcancel"}
    catch_events = re.findall(r'catch(\w+)\s*=', blocks["template"])
    has_catch_non_touch = any(evt not in touch_events for evt in catch_events)

    # l9: no radial-gradient in any RN platform style
    has_radial_gradient = any(
        "radial-gradient" in strip_comments(resolve_style_conditionals(
            blocks["style"], mode))
        for mode in RN_MODES
    )

    # l10-l12: distinguish sibling and parent-child collapse from flex items.
    def apply_vertical_sides(text, property_name, top=None, bottom=None):
        for prop, value in re.findall(
                rf"(?:^|;)\s*({property_name}(?:-(?:top|bottom))?)\s*:\s*([^;}}]+)",
                text):
            value = re.sub(r"\s*!important\s*$", "", value).strip()
            if prop == property_name:
                parts = value.split()
                if len(parts) == 1:
                    top = bottom = parts[0]
                elif len(parts) == 2:
                    top = bottom = parts[0]
                elif len(parts) in (3, 4):
                    top, bottom = parts[0], parts[2]
            elif prop == f"{property_name}-top":
                top = value
            else:
                bottom = value
        return top, bottom

    def class_vertical_sides(class_name, property_name):
        top = bottom = None
        for body in re.findall(
                rf"\.{re.escape(class_name)}\s*\{{([^}}]*)\}}", style_rn_clean):
            top, bottom = apply_vertical_sides(
                body, property_name, top, bottom)
        return top, bottom

    def margin_sides(class_name):
        return class_vertical_sides(class_name, "margin")

    def element_vertical_sides(class_name, property_name):
        sides = []
        class_top, class_bottom = class_vertical_sides(
            class_name, property_name)
        for tag in re.findall(r"<[^>]+>", blocks["template"]):
            class_attr = re.search(
                r'(?<![:\w-])class\s*=\s*["\']([^"\']*)', tag)
            if class_attr and class_name in class_attr.group(1).split():
                inline_style = re.search(
                    r'\bstyle\s*=\s*(["\'])(.*?)\1', tag)
                sides.append(apply_vertical_sides(
                    inline_style.group(2) if inline_style else "",
                    property_name,
                    class_top,
                    class_bottom))
        return sides

    empty_or_zero = {None, "0", "0px", "0rpx"}

    def has_single_sided_gap(first_bottom, second_top, gap):
        return (
            first_bottom == gap and second_top in empty_or_zero
        ) or (
            second_top == gap and first_bottom in empty_or_zero
        )

    _, title_bottom = margin_sides("chart-title-wrapper")
    chart_top, _ = margin_sides("chart-container")
    detail_top, _ = margin_sides("detail-section")
    detail_header_top, _ = margin_sides("detail-header")
    chart_gap_handled = has_single_sided_gap(
        title_bottom, chart_top, "24rpx")
    detail_parent_child_gap_handled = (
        detail_top == "20rpx" and detail_header_top in empty_or_zero)

    stats_displays = []
    for body in re.findall(r"\.stats-section\s*\{([^}]*)\}", style_rn_clean):
        stats_displays.extend(re.findall(
            r"(?:^|;)\s*display\s*:\s*([^;}}]+)", body))
    stat_card_margins = element_vertical_sides("stat-card", "margin")
    wrapper_margins = []
    wrapper_padding = []
    for wrapper_class in ("stat-card-wrapper", "stat-card-wrap"):
        wrapper_margins.extend(element_vertical_sides(
            wrapper_class, "margin"))
        wrapper_padding.extend(element_vertical_sides(
            wrapper_class, "padding"))

    def has_vertical_spacing(sides):
        return bool(sides) and all(
            top == "16rpx" and bottom == "16rpx"
            for top, bottom in sides)

    stat_card_margin_preserved = (
        bool(stats_displays)
        and stats_displays[-1].strip() == "flex"
        and (has_vertical_spacing(stat_card_margins)
             or has_vertical_spacing(wrapper_margins)
             or has_vertical_spacing(wrapper_padding))
    )

    results = [
        {"id": "l1", "text": "样式：position:sticky 替换为 sticky-header 方案",
         "passed": not has_position_sticky and has_sticky_header},

        {"id": "l2", "text": "样式：保留 /*use rpx*/ 和 /*use px*/ 单位转换注释",
         "passed": has_unit_comments},

        {"id": "l3", "text": "样式：background-image 不应用于 text 元素类",
         "passed": not has_bg_on_title},

        {"id": "l5", "text": "模板：scroll-into-view 目标添加 wx:ref",
         "passed": has_wxref_on_scroll_targets},

        {"id": "l6", "text": "模板：createSelectorQuery 目标添加空 wx:ref",
         "passed": has_wxref_on_query_targets},

        {"id": "l7", "text": "脚本：选择器 API 仅使用 #id 或 .class 简单选择器",
         "passed": not has_compound_selector},

        {"id": "l8", "text": "脚本：非触摸事件不使用 catch 前缀",
         "passed": not has_catch_non_touch},

        {"id": "l9", "text": "样式：radial-gradient 使用条件编译隔离或替换",
         "passed": not has_radial_gradient},

        {"id": "l10", "text": "样式：相邻普通块级兄弟 .chart-title-wrapper（margin-bottom:24rpx）与 .chart-container（margin-top:12rpx）的折叠间距归到单侧，保持 24rpx",
         "passed": chart_gap_handled},

        {"id": "l11", "text": "样式：父子同向 margin 折叠的 .detail-section（margin-top:20rpx）与首子元素 .detail-header（margin-top:12rpx）归到父元素侧，保持 20rpx 并清除子元素顶部 margin",
         "passed": detail_parent_child_gap_handled},

        {"id": "l12", "text": "样式：.stats-section 的 flex item 通过 .stat-card margin 或包装层 margin/padding 保留上下 16rpx 间距，不按 margin 折叠场景归零",
         "passed": stat_card_margin_preserved},
    ]
    return results


# ─── eval-5: conditional-compile-advanced ────────────────────────────────────

def check_eval_5(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)

    # c0: @mpx-if wraps entire rules (no empty selectors on any platform)
    has_empty_rules_after_condition = any(
        has_empty_rules(style)
        for style in resolve_clean_styles(blocks["style"], ALL_MODES)
    )

    # c1: iOS RN output uses a single font; original-platform fallbacks do not
    # affect this assertion.
    style_ios_clean = strip_comments(resolve_style_conditionals(
        blocks["style"], "ios"))
    font_family_values = re.findall(
        r"font-family\s*:\s*([^;]+)", style_ios_clean)
    has_multi_font = any("," in val for val in font_family_values)

    # c2: no per-side border-style
    has_per_side_border_style = any(re.search(
        r"border-(top|bottom|left|right)-style\s*:",
        strip_comments(resolve_style_conditionals(blocks["style"], mode)),
    ) for mode in RN_MODES)

    # c4: wx:ref on custom component targeted by selectComponent
    # Check if pay-form component element has wx:ref
    select_targets = re.findall(
        r'selectComponent\s*\(\s*[\'"]([^"\']+)[\'"]', blocks["script"])
    has_wxref_on_custom_comp = True
    for sel in select_targets:
        if sel.startswith("#"):
            id_val = sel[1:]
            if not re.search(
                rf'id="{re.escape(id_val)}"[^>]*wx:ref|wx:ref[^>]*id="{re.escape(id_val)}"',
                blocks["template"]):
                has_wxref_on_custom_comp = False
                break

    # c5: enable-var on elements with dynamic CSS vars via wx:style
    # Only require enable-var on elements whose bound style object contains CSS vars
    script_text = blocks["script"]
    wxstyle_elements = re.findall(
        r'<([^>]*?)wx:style\s*=\s*"\{\{([^}]*)\}\}"([^>]*?)/?>', blocks["template"])
    has_enable_var_on_css_var_elements = True
    for before, style_var, after in wxstyle_elements:
        style_var_name = style_var.strip()
        var_def = re.search(
            rf'(?:const|let|var)\s+{re.escape(style_var_name)}\s*=\s*computed\s*\(\s*\(\)\s*=>\s*\{{(.*?)\}}\s*\)',
            script_text, re.DOTALL)
        if not var_def:
            var_def = re.search(
                rf'{re.escape(style_var_name)}\s*[=:]\s*\{{([^}}]*)\}}',
                script_text, re.DOTALL)
        if var_def and re.search(r"'--[\w-]+'|\"--[\w-]+\"", var_def.group(1)):
            full_tag = before + after
            if "enable-var" not in full_tag:
                has_enable_var_on_css_var_elements = False
                break

    # c6: setup's first argument remains reactive when destructured by field.
    setup_match = re.search(
        r"\bsetup\s*\(\s*([A-Za-z_$][\w$]*)", blocks["script"])
    setup_properties_name = setup_match.group(1) if setup_match else ""
    has_destructured_setup_argument = bool(re.search(
        r"\bsetup\s*\(\s*\{", blocks["script"]))
    has_direct_properties_destructure = bool(
        setup_properties_name and re.search(
            rf"const\s*\{{[^}}]+\}}\s*=\s*{re.escape(setup_properties_name)}\b",
            blocks["script"],
        )
    )
    has_to_refs_call = bool(
        setup_properties_name and re.search(
            rf"toRefs?\s*\(\s*{re.escape(setup_properties_name)}\b",
            blocks["script"],
        )
    )
    properties_reactivity_ok = (
        not has_destructured_setup_argument
        and (not has_direct_properties_destructure or has_to_refs_call))

    # c7: background-repeat only no-repeat on the checked iOS target
    bg_repeat_values_by_mode = (
        re.findall(
            r"background-repeat\s*:\s*([^;]+)",
            strip_comments(resolve_style_conditionals(blocks["style"], mode)),
        )
        for mode in RN_MODES
    )
    background_repeat_ok = all(
        all(value.strip() == "no-repeat" for value in values)
        for values in bg_repeat_values_by_mode
    )

    # c8: JSON block uses if(__mpx_mode__) NOT /* @mpx-if */ comment syntax
    json_block = blocks["json"]
    has_mpx_if_comment_in_json = bool(re.search(r"@mpx-if", json_block))
    has_runtime_mode_check = "__mpx_mode__" in json_block or "ios" not in json_block
    json_conditional_ok = (
        not has_mpx_if_comment_in_json and has_runtime_mode_check)

    # c9: the checked iOS target supports the input's dashed decoration and
    # color, so resolve only iOS and ensure the visual declaration is retained.
    style_ios = strip_comments(resolve_style_conditionals(
        blocks["style"], "ios"))
    text_deco_styles = re.findall(
        r"text-decoration-style\s*:\s*([^;{}]+)", style_ios)
    text_deco_ok = (
        any(value.strip().lower() == "dashed" for value in text_deco_styles)
        and bool(re.search(r"text-decoration-color\s*:", style_ios)))

    # c10: onLoad uses decodedQuery (2nd parameter)
    has_decoded_query = "decodedQuery" in blocks["script"]

    results = [
        {"id": "c0", "text": "样式：@mpx-if 包裹完整规则，不产生空选择器",
         "passed": not has_empty_rules_after_condition},

        {"id": "c1", "text": "样式：RN（ios）输出的 font-family 使用单一字体名",
         "passed": not has_multi_font},

        {"id": "c2", "text": "样式：统一设置 border-style，不使用单边属性",
         "passed": not has_per_side_border_style},

        {"id": "c4", "text": "模板：selectComponent 目标自定义组件添加 wx:ref",
         "passed": has_wxref_on_custom_comp},

        {"id": "c5", "text": "模板：动态 CSS 变量所在元素设置 enable-var",
         "passed": has_enable_var_on_css_var_elements},

        {"id": "c6", "text": "脚本：setup 属性对象不直接解构；按字段解构时通过 toRefs/toRef 保持响应式",
         "passed": properties_reactivity_ok},

        {"id": "c7", "text": "样式：background-repeat 仅使用 no-repeat",
         "passed": background_repeat_ok},

        {"id": "c8", "text": "JSON：条件编译使用 if(__mpx_mode__) 运行时判断，不使用注释语法",
         "passed": json_conditional_ok},

        {"id": "c9", "text": "样式：iOS 输出保留 dashed text-decoration-style 和 text-decoration-color",
         "passed": text_deco_ok},

        {"id": "c10", "text": "脚本：onLoad 使用第二个参数 decodedQuery",
         "passed": has_decoded_query},
    ]
    return results


# ─── eval-6: new-rating-component ───────────────────────────────────

def check_eval_6(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    template = blocks["template"]
    script = blocks["script"]
    style_clean = "\n".join(resolve_clean_styles(blocks["style"]))

    component_block = extract_object_call(script, "createComponent")
    properties_block = extract_named_object(component_block, "properties")
    props_block = extract_named_object(component_block, "props")
    property_options = properties_block + props_block
    data_block = extract_data_option(component_block)
    computed_block = extract_named_object(component_block, "computed")
    watch_block = extract_named_object(component_block, "watch")
    methods_block = extract_named_object(component_block, "methods")
    required_properties = ("ratingKey", "value", "max", "readonly", "label")
    has_required_properties = all(
        re.search(rf"\b{re.escape(name)}\s*:", property_options)
        for name in required_properties
    )
    has_reserved_exposed_key = bool(re.search(
        r"(?:^|[{,])\s*(?:id|data|dataset)\s*(?=[:,}])",
        property_options + data_block + computed_block + methods_block,
    ))

    class_interpolation = bool(re.search(
        r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"', template))
    text_contents = "\n".join(re.findall(
        r"<text(?:\s[^>]*)?>(.*?)</text>", template, re.DOTALL | re.IGNORECASE))
    has_star_text = "★" in text_contents or "☆" in text_contents
    has_score_text = "{{" in text_contents and (
        "/" in text_contents or bool(re.search(r"score|rating", text_contents, re.IGNORECASE))
    )

    unsupported_properties = bool(re.search(
        r"(?:display\s*:\s*grid|position\s*:\s*sticky|white-space\s*:|"
        r"text-overflow\s*:|(?:^|[;{])\s*animation(?:-[\w-]+)?\s*:)",
        style_clean,
    ))
    dynamic_component_ok = False
    expected_range = {"rating-editable-tip", "rating-readonly-tip"}
    for attrs in re.findall(r"<component\b([^>]*)>", template, re.DOTALL | re.IGNORECASE):
        has_dynamic_is = bool(re.search(
            r"\bis\s*=\s*(['\"])\s*\{\{[^}]+\}\}\s*\1", attrs))
        range_match = re.search(r"\brange\s*=\s*(['\"])([^'\"]+)\1", attrs)
        if has_dynamic_is and range_match and {
                name.strip() for name in range_match.group(2).split(",")
        } == expected_range:
            dynamic_component_ok = True
            break

    results = [
        {"id": "n0", "text": "结构：输出为包含 template、普通 script 和 style 的完整组件 SFC，并使用 createComponent 选项式 API",
         "passed": bool(template.strip() and blocks["style"].strip()
                        and component_block
                        and not re.search(r"<script\s+setup(?:\s|>)", src)
                        and not re.search(r"\bsetup\s*\(", component_block))},

        {"id": "n1", "text": "脚本：通过 properties 或 props 定义 ratingKey/value/max/readonly/label，并使用 data/computed/watch/methods 组织逻辑",
         "passed": has_required_properties and all((data_block, computed_block, watch_block, methods_block))},

        {"id": "n2", "text": "功能：根据 max 渲染带 key 的星级列表，并在视觉上区分选中状态",
         "passed": "wx:for" in template and "wx:key" in template
                   and "wx:class" in template
                   and bool(re.search(r"\.(?:[\w-]*(?:selected|active|filled|checked)[\w-]*)\s*\{",
                                      style_clean, re.IGNORECASE))},

        {"id": "n3", "text": "功能：点击处理器校验 readonly，并通过 change 事件传出 ratingKey 和选中值",
         "passed": bool(re.search(
             r"if\s*\([^)]*readonly(?:\.value)?[^)]*\)\s*(?:\{\s*)?return",
             script, re.DOTALL))
                   and bool(re.search(r"this\.triggerEvent\s*\(\s*['\"]change['\"]", script))
                   and "ratingKey" in script and bool(re.search(r"\bvalue\s*:", script))},

        {"id": "n4", "text": "脚本：使用 data 保存本地评分、watch 同步 value，且实例数据键不使用 id/data/dataset",
         "passed": bool(data_block and watch_block)
                   and not has_reserved_exposed_key},

        {"id": "n5", "text": "模板：事件参数使用内联语法，不使用 data-* 或 dataset",
         "passed": bool(re.search(r'bindtap\s*=\s*"[^"]+\([^\"]+\)"', template))
                   and not re.search(r"\bdata-[\w-]+\s*=", template)
                   and not re.search(r"\bdataset\b", script)},

        {"id": "n6", "text": "模板：动态类名使用 wx:class，不在 class 属性中插值",
         "passed": "wx:class" in template and not class_interpolation},

        {"id": "n7", "text": "模板：Mustache 表达式中不调用普通方法",
         "passed": not re.search(r"\{\{[^}]*\b\w+\s*\([^)]*\)", template)},

        {"id": "n8", "text": "模板：用户可见的标签、星级和分数均使用 text 组件显式包裹",
         "passed": bool(re.search(r"\{\{\s*label\b", text_contents))
                   and has_star_text and has_score_text},

        {"id": "n9", "text": "样式：RN 输出仅使用受支持的单类、page 或 :host 选择器",
         "passed": not has_unsupported_selector(style_clean)},

        {"id": "n10", "text": "样式：星级行显式使用 flex-direction:row，且不包含不支持的 CSS 属性",
         "passed": bool(re.search(r"flex-direction\s*:\s*row", style_clean))
                   and not unsupported_properties},

        {"id": "n11", "text": "交互：点击目标使用 hover-class，样式中不包含 :active",
         "passed": "hover-class" in template and ":active" not in style_clean},

        {"id": "n12", "text": "跨端：不直接调用 wx/my API，也不包含不必要的平台条件分支",
         "passed": not re.search(r"\b(?:wx|my)\.", script)
                   and not has_checked_platform_branch(src)},

        {"id": "n13", "text": "模板：动态 component 使用 is 切换只读/可编辑提示，并用 range 精确声明两个候选组件",
         "passed": dynamic_component_ok
                   and all(name in script for name in expected_range)},

        {"id": "n14", "text": "样式：通过 style 中的语义化普通 class 实现，不使用 UnoCSS 或原子 utility class",
         "passed": uses_regular_classes(template, blocks["style"])
                   and not has_atomic_utility_class(template)},
    ]
    return results


# ─── eval-7: new-segmented-control ──────────────────────────────────────────

def check_eval_7(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    template = blocks["template"]
    script = blocks["script"]
    style_clean = "\n".join(resolve_clean_styles(blocks["style"]))
    define_props_block = extract_object_call(script, "defineProps")
    expose_block = extract_object_call(script, "defineExpose")
    required_properties = ("controlKey", "options", "value", "disabled", "label")
    has_required_properties = all(
        re.search(rf"\b{re.escape(name)}\s*:", define_props_block)
        for name in required_properties
    )
    define_props_binding = re.search(
        r"\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*defineProps\s*\(", script)
    properties_name = define_props_binding.group(1) if define_props_binding else ""
    uses_to_refs = bool(
        properties_name and re.search(
            rf"\btoRefs?\s*\(\s*{re.escape(properties_name)}\b", script)
    )
    directly_destructures_properties = bool(
        properties_name and re.search(
            rf"\bconst\s*\{{[^}}]+\}}\s*=\s*{re.escape(properties_name)}\b",
            script,
        )
    )
    class_interpolation = bool(re.search(
        r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"', template))
    text_contents = "\n".join(re.findall(
        r"<text(?:\s[^>]*)?>(.*?)</text>", template, re.DOTALL | re.IGNORECASE))
    unsupported_properties = bool(re.search(
        r"(?:display\s*:\s*grid|position\s*:\s*sticky|white-space\s*:|"
        r"text-overflow\s*:|(?:^|[;{])\s*animation(?:-[\w-]+)?\s*:)",
        style_clean,
    ))
    disabled_guards = re.findall(
        r"if\s*\(([^)]*disabled[^)]*)\)\s*(?:\{\s*)?return",
        script,
        re.DOTALL | re.IGNORECASE,
    )
    passes_item_disabled = bool(re.search(
        r'bindtap\s*=\s*"[^"]+\([^\"]*\.disabled[^\"]*\)"', template))
    checks_item_disabled = bool(re.search(r"\b\w+\.disabled", script)) or (
        passes_item_disabled and any(
            len(re.findall(r"\b[\w$]*disabled\b", guard, re.IGNORECASE)) >= 2
            for guard in disabled_guards
        )
    )
    results = [
        {"id": "u0", "text": "结构：输出为包含 template、script setup 和 style 的完整组件 SFC",
         "passed": bool(template.strip() and blocks["style"].strip()
                        and re.search(r"<script\s+setup(?:\s|>)", src))},

        {"id": "u1", "text": "脚本：defineProps 定义 controlKey/options/value/disabled/label，并通过 defineExpose 暴露模板绑定",
         "passed": has_required_properties and bool(expose_block)},

        {"id": "u2", "text": "脚本：defineProps 返回的属性对象通过 toRefs/toRef 使用，不直接解构",
         "passed": uses_to_refs and not directly_destructures_properties},

        {"id": "u3", "text": "脚本：使用 ref 保存本地选中值并通过 watch 同步 value",
         "passed": "ref(" in script and "watch(" in script and "value" in script},

        {"id": "u4", "text": "功能：使用 computed 派生候选项状态并渲染带 key 的候选列表",
         "passed": "computed(" in script and "wx:for" in template and "wx:key" in template
                   and "wx:class" in template},

        {"id": "u5", "text": "功能：点击处理器校验整体与单项禁用状态，并通过 change 事件传出 controlKey 和 value",
         "passed": bool(disabled_guards) and checks_item_disabled
                   and bool(re.search(r"triggerEvent\s*\(\s*['\"]change['\"]", script))
                   and "controlKey" in script and bool(re.search(r"\bvalue\s*:", script))},

        {"id": "u6", "text": "模板：事件参数使用内联语法，不使用 data-* 或 dataset",
         "passed": bool(re.search(r'bindtap\s*=\s*"[^"]+\([^\"]+\)"', template))
                   and not re.search(r"\bdata-[\w-]+\s*=", template)
                   and not re.search(r"\bdataset\b", script)},

        {"id": "u7", "text": "模板：动态类名使用 wx:class，不在 class 属性中插值",
         "passed": "wx:class" in template and not class_interpolation},

        {"id": "u8", "text": "模板：Mustache 表达式中不调用普通方法",
         "passed": not re.search(r"\{\{[^}]*\b\w+\s*\([^)]*\)", template)},

        {"id": "u9", "text": "模板：标题、候选项和当前选中项文案均使用 text 组件显式包裹",
         "passed": bool(re.search(r"\{\{\s*label\b", text_contents))
                   and bool(re.search(r"\{\{[^}]*\w+\.label", text_contents))
                   and len(re.findall(r"\{\{", text_contents)) >= 3},

        {"id": "u10", "text": "样式：通过 style 中的语义化普通 class 实现，且仅使用 RN 支持的单类选择器",
         "passed": uses_regular_classes(template, blocks["style"])
                   and not has_atomic_utility_class(template)
                   and not has_unsupported_selector(style_clean)},

        {"id": "u11", "text": "样式：候选项容器显式使用 flex-direction:row，且不包含不支持的 CSS 属性",
         "passed": bool(re.search(r"flex-direction\s*:\s*row", style_clean))
                   and not unsupported_properties},

        {"id": "u12", "text": "交互：点击目标使用 hover-class，样式中不包含 :active 或 opacity:0",
         "passed": "hover-class" in template and ":active" not in style_clean
                   and not re.search(r"opacity\s*:\s*0(?:\.0+)?\s*(?:;|})", style_clean)},

        {"id": "u13", "text": "跨端：不直接调用 wx/my API，也不包含不必要的平台条件分支",
         "passed": not re.search(r"\b(?:wx|my)\.", script)
                   and not has_checked_platform_branch(src)},
    ]
    return results


# ─── eval-8: new-task-board-page ────────────────────────────────────────────

def check_eval_8(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    template = blocks["template"]
    script = blocks["script"]
    style_block = strip_comments(blocks["style"]).strip()
    json_block = strip_comments(blocks["json"])
    class_interpolation = bool(re.search(
        r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"', template))
    class_fragment_concat = bool(re.search(
        r"['\"](?:bg|text|border|shadow|rounded|gap|[mp][trblxy]?)-['\"]\s*\+",
        script,
    ))
    text_contents = "\n".join(re.findall(
        r"<text(?:\s[^>]*)?>(.*?)</text>", template, re.DOTALL | re.IGNORECASE))
    has_async_on_load = bool(re.search(
        r"(?:setTimeout|\.then)\s*\([^)]*\{[^}]*\bonLoad\s*\(",
        script,
        re.DOTALL,
    ))
    unsupported_atomic = bool(re.search(
        r"(?:^|[\s'\"])(?:grid(?:-[\w-]+)?|sticky|line-clamp-[\w-]+|"
        r"space-[xy]-[\w.\[\]-]+|transition-all(?:-[\w-]+)?|animate-[\w-]+|"
        r"inline-flex|inline-block|block)(?=$|[\s'\"])",
        template,
    )) or bool(re.search(
        r"(?:active|focus|visited|aria-[\w-]+|data-[\w-]+):",
        template,
    ))
    has_atomic_categories = all(re.search(pattern, template) for pattern in (
        r"(?:^|[\s'\"])flex(?:-(?:row|col|wrap|1))?(?=$|[\s'\"])",
        r"(?:^|[\s'\"])(?:gap|[mp][trblxy]?)-[\w.\[\]-]+(?=$|[\s'\"])",
        r"(?:^|[\s'\"])(?:bg|text)-[\w#\[\]-]+(?:/\d+)?(?=$|[\s'\"])",
        r"(?:^|[\s'\"])rounded(?:-[\w.\[\]-]+)?(?=$|[\s'\"])",
    ))
    results = [
        {"id": "a0", "text": "结构：输出包含 template、script setup 和页面 JSON，且不包含非空 style 区块",
         "passed": bool(template.strip() and json_block.strip()
                        and re.search(r"<script\s+setup(?:\s|>)", src)
                        and not style_block)},

        {"id": "a1", "text": "脚本：使用 ref/computed/onLoad 组合式 API，并通过 defineExpose 暴露模板绑定",
         "passed": all(name in script for name in ("ref(", "computed(", "onLoad(", "defineExpose("))},

        {"id": "a2", "text": "脚本：onLoad 在 setup 执行期同步注册，接收并优先使用 decodedQuery.category",
         "passed": bool(re.search(
             r"onLoad\s*\(\s*(?:\([^,]+,\s*decodedQuery\)|function\s*\([^,]+,\s*decodedQuery\))",
             script,
         )) and "decodedQuery.category" in script and not has_async_on_load},

        {"id": "a3", "text": "模板：主体使用纵向 scroll-view 承载页面滚动",
         "passed": bool(re.search(r"<scroll-view\b[^>]*\bscroll-y(?:\s|=|>)", template, re.DOTALL))},

        {"id": "a4", "text": "功能：渲染带稳定 key 的筛选项和任务列表，并使用 computed 产出筛选结果",
         "passed": template.count("wx:for") >= 2 and template.count("wx:key") >= 2
                   and "computed(" in script},

        {"id": "a5", "text": "功能：支持切换筛选分类和任务完成状态，并渲染空状态",
         "passed": len(re.findall(r'bindtap\s*=\s*"[^"]+\([^\"]+\)"', template)) >= 2
                   and "completed" in script and "wx:if" in template
                   and bool(re.search(r"空|暂无|没有", text_contents))},

        {"id": "a6", "text": "模板：事件参数使用内联语法，不使用 data-* 或 dataset",
         "passed": not re.search(r"\bdata-[\w-]+\s*=", template)
                   and not re.search(r"\bdataset\b", script)},

        {"id": "a7", "text": "模板：动态原子类使用 wx:class 完整 token，不在 class 属性或脚本中拼接类名",
         "passed": "wx:class" in template and not class_interpolation
                   and not class_fragment_concat},

        {"id": "a8", "text": "模板：Mustache 中不调用普通方法，用户可见文字使用 text 组件显式包裹",
         "passed": not re.search(r"\{\{[^}]*\b\w+\s*\([^)]*\)", template)
                   and len(re.findall(r"<text(?:\s|>)", template)) >= 4},

        {"id": "a9", "text": "原子 CSS：视觉样式全部使用模板原子类，包含 Flex/间距/颜色/圆角等支持的 utility",
         "passed": has_atomic_categories and not style_block},

        {"id": "a10", "text": "原子 CSS：半透明颜色使用斜杠 alpha，不使用独立 *-opacity-* 工具类",
         "passed": bool(re.search(
             r"(?:bg|text|border|shadow)-[\w#\[\]-]+/\d+", template))
                   and not re.search(r"(?:bg|text|border|shadow)-opacity-[\w-]+", template)},

        {"id": "a11", "text": "原子 CSS：不使用 RN 不支持的工具类或 variants",
         "passed": not unsupported_atomic},

        {"id": "a12", "text": "交互：筛选项和任务卡片使用 hover-class，且不使用 hover:/active:/focus:/visited: 等 RN 不支持的交互 variant",
         "passed": "hover-class" in template
                   and not re.search(r"(?:hover|active|focus|visited):", template)},

        {"id": "a13", "text": "JSON：导航栏标题为任务看板并设置 disableScroll:true，且不包含 RN 不支持的页面配置",
         "passed": "navigationBarTitleText" in json_block and "任务看板" in json_block
                   and bool(re.search(r"disableScroll\s*:\s*true|\"disableScroll\"\s*:\s*true", json_block))
                   and not re.search(r"enablePullDownRefresh|onReachBottomDistance", json_block)},

        {"id": "a14", "text": "跨端：不直接调用 wx/my API，也不包含不必要的平台条件分支或 uno.css 手动导入",
         "passed": not re.search(r"\b(?:wx|my)\.", script)
                   and not has_checked_platform_branch(src)
                   and not re.search(r"(?:import|require)[^\n]*uno\.css", script)},
    ]
    return results


# ─── Runner ───────────────────────────────────────────────────────────────────

CHECKERS = {0: check_eval_0, 1: check_eval_1, 2: check_eval_2,
            3: check_eval_3, 4: check_eval_4, 5: check_eval_5,
            6: check_eval_6, 7: check_eval_7, 8: check_eval_8}
EVAL_DIRS = {
    0: "eval-0-style-adaptation",
    1: "eval-1-template-adaptation",
    2: "eval-2-script-json-adaptation",
    3: "eval-3-gradient-animation-interaction",
    4: "eval-4-text-layout-selector",
    5: "eval-5-conditional-compile-advanced",
    6: "eval-6-new-rating-component",
    7: "eval-7-new-segmented-control",
    8: "eval-8-new-task-board-page",
}
OUTPUT_FILES = {
    0: "product-card.mpx",
    1: "order-list.mpx",
    2: "user-profile.mpx",
    3: "carousel-card.mpx",
    4: "data-panel.mpx",
    5: "payment-page.mpx",
    6: "rating-selector.mpx",
    7: "segmented-control.mpx",
    8: "task-board.mpx",
}
RUN_KINDS = ("mpx2rn", "mpx2rn_simple", "no_skill")


def _first_present(data, keys):
    for key in keys:
        if key in data:
            return data[key]


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def load_metrics(run_dir):
    """Load metrics.json written by the main agent from task-notification <usage> data."""
    metrics_path = run_dir / "metrics.json"
    if not metrics_path.exists():
        return None, []
    try:
        data = json.loads(metrics_path.read_text())
    except json.JSONDecodeError as e:
        return None, [f"invalid metrics json: {metrics_path}: {e}"]
    if not isinstance(data, dict):
        return None, [f"metrics file must contain an object: {metrics_path}"]

    errors = []
    total_tokens = _first_present(data, ("total_tokens", "tokens"))
    tool_calls = _first_present(data, ("tool_calls", "tool_call_count", "tool_uses"))
    duration_ms = _first_present(data, ("duration_ms", "elapsed_ms"))
    if duration_ms is None:
        duration_seconds = _first_present(
            data, ("duration_seconds", "total_duration_seconds", "time_seconds"))
        if duration_seconds is not None:
            duration_ms = duration_seconds * 1000

    if not _is_number(total_tokens) or total_tokens < 0:
        errors.append("metrics.total_tokens must be a non-negative number")
    if not _is_number(tool_calls) or tool_calls < 0:
        errors.append("metrics.tool_calls must be a non-negative number")
    if not _is_number(duration_ms) or duration_ms < 0:
        errors.append("metrics.duration_ms must be a non-negative number")
    if errors:
        return None, errors

    duration_ms = int(round(duration_ms))
    return {
        "total_tokens": int(round(total_tokens)),
        "tool_calls": int(round(tool_calls)),
        "duration_ms": duration_ms,
        "duration_seconds": round(duration_ms / 1000, 3),
    }, []


def grade_run(eval_id, run_kind):
    eval_dir = WORKSPACE / EVAL_DIRS[eval_id]
    out_path = eval_dir / run_kind / "outputs" / OUTPUT_FILES[eval_id]
    if not out_path.exists():
        print(f"missing: {out_path}", file=sys.stderr)
        return None
    run_dir = eval_dir / run_kind / "run-1"
    run_dir.mkdir(parents=True, exist_ok=True)
    metrics, metric_errors = load_metrics(run_dir)
    if metric_errors:
        print(f"metrics warning for {EVAL_DIRS[eval_id]} / {run_kind}: "
              + "; ".join(metric_errors), file=sys.stderr)
    results = CHECKERS[eval_id](out_path)
    enriched = [{"id": r.get("id", ""), "text": r["text"], "passed": bool(r["passed"]),
                 "evidence": "PASS" if r["passed"] else "FAIL"} for r in results]
    passed = sum(1 for e in enriched if e["passed"])
    total = len(enriched)
    summary = {"pass_rate": round(passed / total, 4) if total else 0.0,
               "passed": passed, "failed": total - passed, "total": total}
    if metrics:
        summary.update(metrics)
    grading = {
        "eval_id": eval_id, "run_kind": run_kind, "expectations": enriched,
        "summary": summary,
        "metrics": metrics,
        "timing": {
            "total_duration_seconds": metrics["duration_seconds"],
            "total_tokens": metrics["total_tokens"],
        } if metrics else {},
        "execution_metrics": {
            "total_tool_calls": metrics["tool_calls"],
            "output_chars": metrics["total_tokens"],
        } if metrics else {},
    }
    (run_dir / "grading.json").write_text(json.dumps(grading, ensure_ascii=False, indent=2))
    return grading


def main():
    summary = []
    for eid in sorted(EVAL_DIRS.keys()):
        for kind in RUN_KINDS:
            g = grade_run(eid, kind)
            if g:
                s = g["summary"]
                metrics = g.get("metrics") or {}
                summary.append({"eval": EVAL_DIRS[eid], "kind": kind,
                                "score": f"{s['passed']}/{s['total']}",
                                "total_tokens": metrics.get("total_tokens"),
                                "tool_calls": metrics.get("tool_calls"),
                                "duration_ms": metrics.get("duration_ms")})
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
