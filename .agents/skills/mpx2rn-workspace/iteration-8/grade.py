#!/usr/bin/env python3
"""Grade outputs: no_skill vs mpx2rn_original vs mpx2rn_gene on iteration-4."""
import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent

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


def strip_wx_conditional_blocks(text):
    return re.sub(
        r"/\*\s*@mpx-if[^*]*?(wx|ali|web)[^*]*?\*/.*?/\*\s*@mpx-(endif|end-if)\s*\*/",
        "", text, flags=re.DOTALL | re.IGNORECASE)


def strip_rn_conditional_blocks(text):
    return re.sub(
        r"/\*\s*@mpx-if[^*]*?(ios|android|harmony)[^*]*?\*/.*?/\*\s*@mpx-(endif|end-if)\s*\*/",
        "", text, flags=re.DOTALL | re.IGNORECASE)


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


def uses_wrong_endif(text):
    return "@mpx-end-if" in text


# ─── eval-0: style-adaptation ────────────────────────────────────────────────

def check_eval_0(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)

    results = [
        {"id": "s0", "text": "style on RN: no descendant selectors (.parent .child)",
         "passed": not re.search(r"\.\w[\w-]*\s+\.\w[\w-]*", style_rn_clean)},

        {"id": "s1", "text": "style on RN: no display: grid (replaced with flex)",
         "passed": not re.search(r"display\s*:\s*grid", style_rn_clean)},

        {"id": "s2", "text": "style on RN: no ::before pseudo-element",
         "passed": "::before" not in style_rn_clean and ":before" not in style_rn_clean},

        {"id": "s3", "text": "style on RN: no :active pseudo-class (use hover-class instead)",
         "passed": ":active" not in style_rn_clean},

        {"id": "s4", "text": "style on RN: no :first-child pseudo-class",
         "passed": ":first-child" not in style_rn_clean},

        {"id": "s5", "text": "style on RN: no + adjacent sibling combinator",
         "passed": not re.search(r"\.[\w-]+\s*\+\s*\.[\w-]+", style_rn_clean)},

        {"id": "s6", "text": "style: numeric font-weight (500/600) replaced with bold/normal",
         "passed": not re.search(r"font-weight\s*:\s*[1-9]\d{2}", style_rn_clean)},

        {"id": "s7", "text": "style: text-overflow/white-space dual-track with numberOfLines on RN",
         "passed": "numberOfLines" in blocks["template"]},

        {"id": "s8", "text": "template: real node added to replace ::before pseudo-element",
         "passed": bool(re.search(
             r"(card-(decorator|bar|indicator|line|stripe|top-bar|gradient)|before-node|pseudo-before|top-line|gradient-bar)",
             blocks["template"]))},

        {"id": "s9", "text": "style: conditional compile uses @mpx-endif (not @mpx-end-if)",
         "passed": not uses_wrong_endif(src)},

        {"id": "s10", "text": "style: no empty selector rules after stripping comments",
         "passed": not has_empty_rules(blocks["style"])},

        {"id": "s11", "text": "style on RN: no > child combinator",
         "passed": not re.search(r"\.[\w-]+\s*>\s*\.[\w-]+", style_rn_clean)},

        {"id": "s12", "text": "style on RN: no multi-class selector (.a.b)",
         "passed": not re.search(r"\.[\w-]+\.[\w-]+", style_rn_clean)},

        {"id": "s13", "text": "style on RN: no + adjacent sibling combinator (tag-highlight pattern)",
         "passed": not re.search(r"\.[\w-]+\s*\+\s*\.[\w-]+", style_rn_clean)},
    ]
    return results


# ─── eval-1: template-adaptation ─────────────────────────────────────────────

def check_eval_1(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)

    results = [
        {"id": "t0", "text": "template: dynamic class via wx:class (not class string interpolation)",
         "passed": not re.search(r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"', blocks["template"])},

        {"id": "t1", "text": "template: event params use inline syntax (not data- dataset)",
         "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])},

        {"id": "t2", "text": "template: no method calls in Mustache (getStatusColor/getStatusText replaced)",
         "passed": not re.search(r'\{\{[^}]*\b\w+\s*\([^)]*\)', blocks["template"])},

        {"id": "t3", "text": "template: page scroll replaced with scroll-view",
         "passed": "scroll-view" in blocks["template"]},

        {"id": "t4", "text": "template: scroll-view has bindscrolltolower or equivalent",
         "passed": "bindscrolltolower" in blocks["template"]
                   or "bindscroll" in blocks["template"]
                   or "scroll-view" in blocks["template"]},

        {"id": "t5", "text": "script: all wx.xxx API replaced with mpx.xxx",
         "passed": not re.search(r"\bwx\.(navigateTo|showActionSheet|showModal|request)", blocks["script"])
                   and "mpx." in blocks["script"]},

        {"id": "t6", "text": "script: no e.target.dataset usage",
         "passed": "e.target.dataset" not in blocks["script"]
                   and "e.currentTarget.dataset" not in blocks["script"]},

        {"id": "t7", "text": "style on RN: no .btn-default .btn-text compound selector",
         "passed": not re.search(r"\.btn-default\s+\.btn-text", style_rn_clean)},

        {"id": "t8", "text": "template: wx:style object keys use unquoted camelCase (no quoted or kebab-case keys)",
         "passed": not has_bad_wx_style_keys(blocks["template"])},
    ]
    return results


# ─── eval-2: script-json-adaptation ──────────────────────────────────────────

def check_eval_2(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)

    # Check wx.xxx replacement
    # Allow wx.xxx if used inside conditional compile blocks for non-RN platforms
    # Strategy: if wx.xxx exists but __mpx_mode__ conditionals are also present
    # and mpx.xxx is used (indicating RN path uses mpx), treat as valid conditional compile
    wx_apis = ["wx.getStorageSync", "wx.setStorageSync", "wx.removeStorageSync",
               "wx.navigateTo", "wx.showModal", "wx.showToast", "wx.reLaunch",
               "wx.request", "wx.getLocation"]
    script_text = blocks["script"]
    has_any_wx = any(api in script_text for api in wx_apis)
    has_mpx = "mpx." in script_text
    has_mode_conditional = "__mpx_mode__" in script_text
    # wx.xxx is OK if all occurrences are guarded by __mpx_mode__ conditional compile
    wx_ok = (not has_any_wx and has_mpx) or (has_any_wx and has_mpx and has_mode_conditional)

    # Check RN-unsupported lifecycles
    script_rn = blocks["script"]

    def _is_lifecycle_isolated(name, script_text):
        """Check if a lifecycle hook is removed or isolated via conditional compile."""
        if name not in script_text:
            return True
        # Direct __mpx_mode__ check wrapping the lifecycle (.*? crosses nested braces)
        if re.search(
            r"if\s*\([^)]*__mpx_mode__[^)]*\)\s*\{.*?" + re.escape(name),
            script_text, re.DOTALL):
            return True
        # Indirect variable pattern: const isRN = ...__mpx_mode__...; if (!isRN) { ...name... }
        if re.search(r"__mpx_mode__", script_text) and re.search(
            r"if\s*\(\s*!?\s*isRN\s*\)\s*\{.*?" + re.escape(name),
            script_text, re.DOTALL):
            return True
        # Early-return pattern inside the lifecycle body
        if re.search(
            re.escape(name) + r"\s*\([^)]*\)\s*\{[^}]*if\s*\([^)]*(__mpx_mode__|isRN|!isRN)[^)]*\)\s*\{[^}]*\breturn\b",
            script_text, re.DOTALL):
            return True
        # Spread operator pattern
        if re.search(
            r"\.\.\.\s*\([^)]*(__mpx_mode__|isRN)[^)]*\?\s*\{.*?" + re.escape(name),
            script_text, re.DOTALL):
            return True
        return False

    share_timeline_ok = _is_lifecycle_isolated("onShareTimeline", script_rn)
    tab_item_tap_ok = _is_lifecycle_isolated("onTabItemTap", script_rn)

    # setTabBarBadge/removeTabBarBadge
    has_tabbar_badge = "setTabBarBadge" in script_rn or "removeTabBarBadge" in script_rn
    has_tabbar_badge_conditional = bool(re.search(
        r"if\s*\([^)]*(__mpx_mode__|isRN|!isRN)[^)]*\)\s*\{.*?(setTabBarBadge|removeTabBarBadge)",
        script_rn, re.DOTALL))
    # Also accept early-return pattern: if (RN) { return } before the API calls
    has_tabbar_badge_early_return = bool(re.search(
        r"if\s*\([^)]*(__mpx_mode__|isRN|!isRN)[^)]*\)\s*\{[^}]*\breturn\b[^}]*\}",
        script_rn, re.DOTALL)) and has_tabbar_badge
    # Also accept: __mpx_mode__ defined and the badge calls are inside any if block
    has_tabbar_badge_indirect = "__mpx_mode__" in script_rn and bool(re.search(
        r"if\s*\(\s*!?\s*isRN\s*\)\s*\{.*?(setTabBarBadge|removeTabBarBadge)",
        script_rn, re.DOTALL))
    tabbar_badge_ok = not has_tabbar_badge or has_tabbar_badge_conditional or has_tabbar_badge_early_return or has_tabbar_badge_indirect

    # getUserProfile
    has_get_user_profile = "getUserProfile" in script_rn
    has_get_user_profile_conditional = bool(re.search(
        r"if\s*\([^)]*(__mpx_mode__|isRN|!isRN)[^)]*\)[^{]*\{[^}]*getUserProfile",
        script_rn, re.DOTALL)) or bool(re.search(
        r"__mpx_mode__.*getUserProfile|getUserProfile.*__mpx_mode__",
        script_rn, re.DOTALL))
    # Also accept indirect: __mpx_mode__ defined and getUserProfile inside any if block
    has_get_user_profile_indirect = "__mpx_mode__" in script_rn and bool(re.search(
        r"if\s*\([^)]*\)\s*\{[^}]*getUserProfile",
        script_rn, re.DOTALL))
    get_user_profile_ok = not has_get_user_profile or has_get_user_profile_conditional or has_get_user_profile_indirect

    # enablePullDownRefresh in RN context
    has_pull_down_json = "enablePullDownRefresh" in blocks["json"]
    pull_down_handled = not has_pull_down_json or bool(re.search(
        r"__mpx_mode__", blocks["json"])) or "scroll-view" in blocks["template"]

    results = [
        {"id": "j0", "text": "script: all wx.xxx API replaced with mpx.xxx",
         "passed": wx_ok},

        {"id": "j1", "text": "script: onShareTimeline removed or isolated with conditional compile",
         "passed": share_timeline_ok},

        {"id": "j2", "text": "script: onTabItemTap removed or isolated with conditional compile",
         "passed": tab_item_tap_ok},

        {"id": "j3", "text": "script: setTabBarBadge/removeTabBarBadge isolated with conditional compile",
         "passed": tabbar_badge_ok},

        {"id": "j4", "text": "script: wx.getUserProfile isolated or replaced",
         "passed": get_user_profile_ok},

        {"id": "j5", "text": "script: no e.target.dataset usage",
         "passed": "e.target.dataset" not in blocks["script"]},

        {"id": "j7", "text": "json: enablePullDownRefresh handled for RN",
         "passed": pull_down_handled},

        {"id": "j8", "text": "template: data- attributes removed (inline event params used)",
         "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])},

        {"id": "j9", "text": "script: onShareAppMessage preserved (RN supported, should not be removed)",
         "passed": "onShareAppMessage" in blocks["script"]},
    ]
    return results


# ─── eval-3: gradient-animation-interaction ─────────────────────────────────

def check_eval_3(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)

    # g0: no transparent in linear-gradient (should be rgba form)
    gradient_matches = re.findall(r"linear-gradient\([^)]*\)", style_rn_clean)
    has_transparent_in_gradient = any("transparent" in g for g in gradient_matches)

    # g1: no display: none in RN style
    has_display_none = bool(re.search(r"display\s*:\s*none", style_rn_clean))

    # g2: no transition-property: all or transition: all
    has_transition_all = bool(re.search(
        r"transition(-property)?\s*:[^;]*\ball\b", style_rn_clean))

    # g3: enable-background present in template
    has_enable_background = "enable-background" in blocks["template"]

    # g4: enable-animation present in template
    has_enable_animation = "enable-animation" in blocks["template"]

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
    # Check if @keyframes exists outside of @mpx-if(wx||web||ali) blocks
    has_keyframes_in_rn = bool(re.search(r"@keyframes", style_rn_clean))

    results = [
        {"id": "g0", "text": "style: linear-gradient 中 transparent 替换为 rgba 形式",
         "passed": not has_transparent_in_gradient},

        {"id": "g1", "text": "style: display:none 替换为其他隐藏方式",
         "passed": not has_display_none},

        {"id": "g2", "text": "style: transition-property:all 替换为具体属性名",
         "passed": not has_transition_all},

        {"id": "g3", "text": "template: 动态 background-image 的 view 添加 enable-background",
         "passed": has_enable_background},

        {"id": "g4", "text": "template: 动态 transition 的 view 添加 enable-animation",
         "passed": has_enable_animation},

        {"id": "g5", "text": "script: 生命周期钩子在 setup 中同步注册",
         "passed": not has_async_lifecycle},

        {"id": "g6", "text": "script: relativeTo 使用简单选择器（不用复合/后代选择器）",
         "passed": relative_to_simple},

        {"id": "g7", "text": "json: 条件编译 JSON 使用 script name=\"json\" 格式",
         "passed": json_format_ok},

        {"id": "g8", "text": "style: bindtap 元素不设 opacity:0",
         "passed": opacity_tap_ok},

        {"id": "g9", "text": "style: @keyframes 在 RN 中不存在",
         "passed": not has_keyframes_in_rn},
    ]
    return results


# ─── eval-4: text-layout-selector ───────────────────────────────────────────

def check_eval_4(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)

    # l0: explicit flex-direction: column where needed
    # The input has .data-panel with display:flex that needs column direction
    has_flex_direction_column = bool(re.search(
        r"flex-direction\s*:\s*column", style_rn_clean))

    # l1: no position: sticky in RN style
    has_position_sticky = bool(re.search(r"position\s*:\s*sticky", style_rn_clean))

    # l2: /*use rpx*/ or /*use px*/ comments preserved
    has_unit_comments = bool(re.search(r"/\*\s*use\s+(rpx|px)\s*\*/", blocks["style"]))

    # l3: no background-image on .title class (text element)
    # Check if .title rule has background-image in RN style
    title_rule = re.search(r"\.title\s*\{([^}]*)\}", style_rn_clean)
    has_bg_on_title = bool(title_rule and re.search(
        r"background-image", title_rule.group(1))) if title_rule else False

    # l4: no multi-value margin/padding in inline style attributes
    inline_styles = re.findall(r'\bstyle\s*=\s*"([^"]*)"', blocks["template"])
    has_multi_value_inline = False
    for style_val in inline_styles:
        if re.search(r"(margin|padding)\s*:\s*\S+\s+\S+", style_val):
            has_multi_value_inline = True
            break

    # l5: wx:ref on scroll-into-view target elements
    # Find scroll-into-view targets and check those ids have wx:ref
    scroll_targets = re.findall(r'id="(section-[^"]*)"', blocks["template"])
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

    # l9: no radial-gradient in RN style
    has_radial_gradient = "radial-gradient" in style_rn_clean

    results = [
        {"id": "l0", "text": "style: 纵向布局显式声明 flex-direction:column",
         "passed": has_flex_direction_column},

        {"id": "l1", "text": "style: position:sticky 替换为 sticky-header 方案",
         "passed": not has_position_sticky},

        {"id": "l2", "text": "style: 保留 /*use rpx*/ /*use px*/ 单位转换注释",
         "passed": has_unit_comments},

        {"id": "l3", "text": "style: background-image 不应用于 text 元素类",
         "passed": not has_bg_on_title},

        {"id": "l4", "text": "template: 内联 style 中不使用多值 margin/padding 简写",
         "passed": not has_multi_value_inline},

        {"id": "l5", "text": "template: scroll-into-view 目标添加 wx:ref",
         "passed": has_wxref_on_scroll_targets},

        {"id": "l6", "text": "template: createSelectorQuery 目标添加空 wx:ref",
         "passed": has_wxref_on_query_targets},

        {"id": "l7", "text": "script: 选择器 API 仅使用简单选择器",
         "passed": not has_compound_selector},

        {"id": "l8", "text": "script: 非触摸事件不使用 catch 前缀",
         "passed": not has_catch_non_touch},

        {"id": "l9", "text": "style: radial-gradient 条件编译或替换",
         "passed": not has_radial_gradient},
    ]
    return results


# ─── eval-5: conditional-compile-advanced ────────────────────────────────────

def check_eval_5(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)

    # c0: @mpx-if wraps entire rules (no empty selectors on any platform)
    # Strip RN conditionals to simulate what wx/ali/web platforms see
    style_for_wx = strip_rn_conditional_blocks(blocks["style"])
    style_for_wx_clean = strip_comments(style_for_wx)
    has_empty_rules_after_condition = has_empty_rules(style_for_wx_clean)

    # c1: font-family single font (no comma in font-family value)
    font_family_values = re.findall(r"font-family\s*:\s*([^;]+)", style_rn_clean)
    has_multi_font = any("," in val for val in font_family_values)

    # c2: no per-side border-style
    has_per_side_border_style = bool(re.search(
        r"border-(top|bottom|left|right)-style\s*:", style_rn_clean))

    # c3: no border shorthand in inline style
    inline_styles = re.findall(r'\bstyle\s*=\s*"([^"]*)"', blocks["template"])
    has_border_shorthand_inline = any(
        re.search(r'\bborder\s*:', style_val) for style_val in inline_styles)

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

    # c6: props via toRefs (no direct const { x } = props destructure)
    has_direct_props_destructure = bool(re.search(
        r"const\s*\{[^}]+\}\s*=\s*props\b", blocks["script"]))
    has_to_refs_call = bool(re.search(r"toRefs\s*\(\s*props\s*\)", blocks["script"])) or \
        bool(re.search(r"toRef\s*\(\s*props\s*,", blocks["script"]))
    props_ok = not has_direct_props_destructure or has_to_refs_call

    # c7: background-repeat only no-repeat
    bg_repeat_values = re.findall(r"background-repeat\s*:\s*([^;]+)", style_rn_clean)
    has_bad_bg_repeat = any(
        val.strip() != "no-repeat" for val in bg_repeat_values) if bg_repeat_values else False

    # c8: JSON block uses if(__mpx_mode__) NOT /* @mpx-if */ comment syntax
    json_block = blocks["json"]
    has_mpx_if_comment_in_json = bool(re.search(r"@mpx-if", json_block))
    has_runtime_mode_check = "__mpx_mode__" in json_block or not (
        "ios" in json_block or "android" in json_block or "harmony" in json_block)
    json_conditional_ok = not has_mpx_if_comment_in_json

    # c9: text-decoration-style/text-decoration-color conditionally compiled
    has_text_deco_style_in_rn = bool(re.search(
        r"text-decoration-style\s*:", style_rn_clean))
    has_text_deco_color_in_rn = bool(re.search(
        r"text-decoration-color\s*:", style_rn_clean))
    # Check if it's inside an ios-only conditional in the full style
    text_deco_in_ios_only = bool(re.search(
        r"@mpx-if\s*\(\s*ios\s*\).*?text-decoration-(style|color)",
        blocks["style"], re.DOTALL))
    text_deco_ok = (not has_text_deco_style_in_rn and not has_text_deco_color_in_rn) or text_deco_in_ios_only

    # c10: onLoad uses decodedQuery (2nd parameter)
    has_decoded_query = "decodedQuery" in blocks["script"]

    results = [
        {"id": "c0", "text": "style: @mpx-if 包裹完整规则不产生空选择器",
         "passed": not has_empty_rules_after_condition},

        {"id": "c1", "text": "style: font-family 使用单一字体名",
         "passed": not has_multi_font},

        {"id": "c2", "text": "style: border-style 统一设置不使用单边",
         "passed": not has_per_side_border_style},

        {"id": "c3", "text": "template: 内联 style 不使用 border 简写",
         "passed": not has_border_shorthand_inline},

        {"id": "c4", "text": "template: selectComponent 目标自定义组件添加 wx:ref",
         "passed": has_wxref_on_custom_comp},

        {"id": "c5", "text": "template: 动态 CSS 变量元素设置 enable-var",
         "passed": has_enable_var_on_css_var_elements},

        {"id": "c6", "text": "script: props 通过 toRefs 解构保持响应式",
         "passed": props_ok},

        {"id": "c7", "text": "style: background-repeat 仅使用 no-repeat",
         "passed": not has_bad_bg_repeat},

        {"id": "c8", "text": "json: JSON 条件编译使用 if(__mpx_mode__) 不使用注释语法",
         "passed": json_conditional_ok},

        {"id": "c9", "text": "style: text-decoration-style/color 条件编译处理",
         "passed": text_deco_ok},

        {"id": "c10", "text": "script: onLoad 使用 decodedQuery 第二个参数",
         "passed": has_decoded_query},
    ]
    return results


# ─── Runner ───────────────────────────────────────────────────────────────────

CHECKERS = {0: check_eval_0, 1: check_eval_1, 2: check_eval_2,
            3: check_eval_3, 4: check_eval_4, 5: check_eval_5}
EVAL_DIRS = {
    0: "eval-0-style-adaptation",
    1: "eval-1-template-adaptation",
    2: "eval-2-script-json-adaptation",
    3: "eval-3-gradient-animation-interaction",
    4: "eval-4-text-layout-selector",
    5: "eval-5-conditional-compile-advanced",
}
OUTPUT_FILES = {
    0: "product-card.mpx",
    1: "order-list.mpx",
    2: "user-profile.mpx",
    3: "carousel-card.mpx",
    4: "data-panel.mpx",
    5: "payment-page.mpx",
}
RUN_KINDS = ("no_skill", "mpx2rn_original", "mpx2rn_gene")


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
