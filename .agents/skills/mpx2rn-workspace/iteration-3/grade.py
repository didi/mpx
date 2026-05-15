#!/usr/bin/env python3
"""Grade outputs: mpx2rn-gene vs mpx2rn (original) on iteration-3."""
import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent

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

def strip_comments(text): return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)

def strip_wx_conditional_blocks(text):
    return re.sub(
        r"/\*\s*@mpx-if[^*]*?(wx|ali|web)[^*]*?\*/.*?/\*\s*@mpx-(endif|end-if)\s*\*/",
        "", text, flags=re.DOTALL | re.IGNORECASE)

def strip_at_rules(text):
    """Strip @keyframes and @media blocks so they don't trigger nesting detection."""
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

def uses_wrong_endif(text): return "@mpx-end-if" in text

def has_bad_wx_style_keys(template_text):
    """Check for quoted or kebab-case keys in wx:style object literals."""
    wx_style_exprs = re.findall(r'wx:style\s*=\s*"([^"]*)"', template_text)
    for expr in wx_style_exprs:
        if re.search(r"""['"]\s*[a-zA-Z][\w-]*\s*['"]\s*:""", expr):
            return True
        if re.search(r'[a-zA-Z][\w]*-[\w-]*\s*:', expr):
            return True
    return False

def check_eval_0(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    results = [
        {"text": "style: no less nesting (& or rule-in-rule)",
         "passed": not has_less_nesting(blocks["style"])},
        {"text": "style on RN (wx-conditional stripped): no :active",
         "passed": ":active" not in strip_comments(style_rn)},
        {"text": "style on RN: no :first-child",
         "passed": ":first-child" not in strip_comments(style_rn)},
        {"text": "script: replaced wx.request with mpx.request",
         "passed": "wx.request" not in blocks["script"] and "mpx.request" in blocks["script"]},
        {"text": "script: replaced wx.navigateTo with mpx.navigateTo",
         "passed": "wx.navigateTo" not in blocks["script"] and "mpx.navigateTo" in blocks["script"]},
        {"text": "template: event params use inline syntax (not data- dataset)",
         "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])
                   and "dataset" not in blocks["script"]},
        {"text": "template: dynamic class via wx:class (not class string interp)",
         "passed": not re.search(r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"', blocks["template"])},
        {"text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
         "passed": not uses_wrong_endif(src)},
        {"text": "style: no empty selector rules after stripping comments",
         "passed": not has_empty_rules(blocks["style"])},
    ]
    return results

def check_eval_1(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    uses_setup = bool(re.search(r"<script\s+setup", src, re.IGNORECASE)) or \
                 bool(re.search(r"\bsetup\s*\(", blocks["script"]))
    results = [
        {"text": "uses composition API (script setup or setup())", "passed": uses_setup},
        {"text": "style: no nesting / compound selectors",
         "passed": not has_less_nesting(blocks["style"])
                   and not re.search(r"\.[\w-]+\s+\.[\w-]+\s*\{", strip_comments(blocks["style"]))},
        {"text": "uses hover-class for press feedback (not bare :active on root)",
         "passed": "hover-class" in blocks["template"] and ":active" not in strip_comments(style_rn)},
        {"text": "triggerEvent('tap', ...) is called",
         "passed": bool(re.search(r"triggerEvent\s*\(\s*['\"]tap['\"]", blocks["script"]))},
        {"text": "title uses numberOfLines for ellipsis", "passed": "numberOfLines" in blocks["template"]},
        {"text": "avatar uses <image> (not <img>)",
         "passed": "<image" in blocks["template"] and "<img" not in blocks["template"]},
        {"text": "text content wrapped in <text> elements", "passed": "<text" in blocks["template"]},
        {"text": "defineProps uses Mpx-style value: (not Vue-style default:)",
         "passed": "value:" in blocks["script"] and "default:" not in blocks["script"]},
        {"text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
         "passed": not uses_wrong_endif(src)},
    ]
    return results

def check_eval_2(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)
    results = [
        {"text": "style: no less nesting outside of conditional compile",
         "passed": not has_less_nesting(strip_wx_conditional_blocks(blocks["style"]))},
        {"text": "style on RN: no ::before pseudo-element",
         "passed": "::before" not in style_rn_clean and ":before" not in style_rn_clean},
        {"text": "style on RN: no display: grid",
         "passed": not re.search(r"display\s*:\s*grid", style_rn_clean)},
        {"text": "style on RN: no :active pseudo-class", "passed": ":active" not in style_rn_clean},
        {"text": "style on RN: no + adjacent sibling combinator",
         "passed": not re.search(r"\.[\w-]+\s*\+\s*\.[\w-]+", style_rn_clean)},
        {"text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
         "passed": not uses_wrong_endif(src)},
        {"text": "style: numeric font-weight (e.g. 600) replaced with bold/normal",
         "passed": not re.search(r"font-weight\s*:\s*[1-9]\d{2}", style_rn_clean)},
        {"text": "template: real node added to replace ::before",
         "passed": bool(re.search(r"(card-(decorator|bar|indicator|line|stripe)|before-node|pseudo-before)", blocks["template"]))},
        {"text": "style: no empty selector rules", "passed": not has_empty_rules(blocks["style"])},
    ]
    return results

def check_eval_3(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)
    results = []
    has_wxref_chart = bool(re.search(r'id="chartBox"[^>]*wx:ref', blocks["template"])) or \
                      bool(re.search(r'wx:ref[^>]*id="chartBox"', blocks["template"]))
    has_wxref_lazy = bool(re.search(r'id="lazyArea"[^>]*wx:ref', blocks["template"])) or \
                     bool(re.search(r'wx:ref[^>]*id="lazyArea"', blocks["template"]))
    results.append({"text": "selector API nodes (#chartBox, #lazyArea) have empty wx:ref in template",
                    "passed": has_wxref_chart and has_wxref_lazy})
    results.append({"text": "wx.createAnimation replaced with mpx.createAnimation",
                    "passed": "wx.createAnimation" not in blocks["script"]
                              and "mpx.createAnimation" in blocks["script"]})
    results.append({"text": "gradient transparent replaced with rgba equivalent",
                    "passed": "transparent" not in style_rn_clean
                              or bool(re.search(r"rgba\(\s*\d+", style_rn_clean))})
    has_rem = bool(re.search(r":\s*[\d.]+rem", style_rn_clean))
    results.append({"text": "rem units converted to rpx", "passed": not has_rem})
    results.append({"text": "template: event params use inline syntax (not data- dataset)",
                    "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])
                              and "dataset" not in blocks["script"]})
    results.append({"text": "enable-animation declared on animated view",
                    "passed": "enable-animation" in blocks["template"]})
    has_keyframes_rn = bool(re.search(r"@keyframes", style_rn_clean))
    results.append({"text": "@keyframes isolated with conditional compile (RN does not support)",
                    "passed": not has_keyframes_rn})
    has_display_none_rn = bool(re.search(r"display\s*:\s*none", style_rn_clean))
    results.append({"text": "display:none replaced with wx:if or size-zero hiding",
                    "passed": not has_display_none_rn})
    has_transition_rn = bool(re.search(r"transition\s*:", style_rn_clean))
    results.append({"text": "transition preserved on RN (not stripped into wx-only conditional)",
                    "passed": has_transition_rn})
    results.append({"text": "style: no less nesting (all selectors flattened to single-class)",
                    "passed": not has_less_nesting(blocks["style"])})
    results.append({"text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
                    "passed": not uses_wrong_endif(src)})
    results.append({"text": "wx:style object keys use unquoted camelCase (no quoted or kebab-case keys)",
                    "passed": not has_bad_wx_style_keys(blocks["template"])})
    return results

def check_eval_4(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)
    results = []
    results.append({"text": "multipleSlots: true preserved in component options",
                    "passed": "multipleSlots" in blocks["script"] and "true" in blocks["script"]})
    results.append({"text": "CSS variables (var(--...)) syntax preserved",
                    "passed": bool(re.search(r"var\(--", blocks["style"]))})
    results.append({"text": "$t() i18n function calls preserved in template",
                    "passed": "$t(" in blocks["template"] or "$t'" in blocks["template"]})
    bg_on_text = bool(re.search(r"<text[^>]*enable-background", blocks["template"]))
    results.append({"text": "background-image only on view components (not text)",
                    "passed": not bg_on_text})
    results.append({"text": "enable-background declared on dynamic background view",
                    "passed": "enable-background" in blocks["template"]})
    has_after_rn = "::after" in style_rn_clean or ":after" in style_rn_clean
    results.append({"text": "::after pseudo-element replaced with real node",
                    "passed": not has_after_rn})
    results.append({"text": "style: no less nesting (all selectors flattened)",
                    "passed": not has_less_nesting(blocks["style"])})
    results.append({"text": "calc() preserved or replaced with flex equivalent",
                    "passed": "calc(" in blocks["style"]
                              or "flex:" in style_rn_clean or "flex-grow" in style_rn_clean})
    results.append({"text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
                    "passed": not uses_wrong_endif(src)})
    return results

def check_eval_5(output_path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)
    results = []
    results.append({"text": "Pinia store import and usage preserved",
                    "passed": "useProductStore" in blocks["script"]})
    has_scroll_view = "scroll-view" in blocks["template"]
    has_scroll_events = "bindscrolltolower" in blocks["template"] or "bindrefresherrefresh" in blocks["template"]
    results.append({"text": "onPullDownRefresh/onReachBottom replaced with scroll-view events",
                    "passed": has_scroll_view and has_scroll_events})
    has_wxref_exposure = bool(re.search(r'id="exposureAnchor"[^>]*wx:ref', blocks["template"])) or \
                         bool(re.search(r'wx:ref[^>]*id="exposureAnchor"', blocks["template"]))
    results.append({"text": "createIntersectionObserver target (#exposureAnchor) has wx:ref",
                    "passed": has_wxref_exposure})
    has_wx_api = bool(re.search(r"\bwx\.(request|navigateTo|stopPullDownRefresh)", blocks["script"]))
    has_mpx_api = "mpx." in blocks["script"]
    results.append({"text": "all wx.xxx replaced with mpx.xxx",
                    "passed": not has_wx_api and has_mpx_api})
    results.append({"text": "template: event params use inline syntax (not data- dataset)",
                    "passed": not re.search(r'\bdata-\w+\s*=', blocks["template"])
                              and "dataset" not in blocks["script"]})
    has_float_rn = bool(re.search(r"float\s*:\s*(left|right)", style_rn_clean))
    results.append({"text": "float layout replaced with flex",
                    "passed": not has_float_rn})
    has_numeric_fw = bool(re.search(r"font-weight\s*:\s*[1-9]\d{2}", style_rn_clean))
    results.append({"text": "font-weight numeric (500/700) replaced with bold/normal",
                    "passed": not has_numeric_fw})
    results.append({"text": "style: no less nesting (all selectors flattened)",
                    "passed": not has_less_nesting(blocks["style"])})
    results.append({"text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
                    "passed": not uses_wrong_endif(src)})
    return results

CHECKERS = {0: check_eval_0, 1: check_eval_1, 2: check_eval_2,
            3: check_eval_3, 4: check_eval_4, 5: check_eval_5}
EVAL_DIRS = {0: "eval-0-adapt-list-page", 1: "eval-1-create-card-component", 2: "eval-2-adapt-style-block",
             3: "eval-3-selector-api-animation", 4: "eval-4-slots-cssvar-i18n", 5: "eval-5-pinia-scroll-intersection"}
OUTPUT_FILES = {0: "list.mpx", 1: "card.mpx", 2: "style-block.mpx",
                3: "dashboard.mpx", 4: "panel.mpx", 5: "product-list.mpx"}
RUN_KINDS = ("mpx2rn_gene", "mpx2rn_original")

def grade_run(eval_id, run_kind):
    eval_dir = WORKSPACE / EVAL_DIRS[eval_id]
    out_path = eval_dir / run_kind / "outputs" / OUTPUT_FILES[eval_id]
    if not out_path.exists():
        print(f"missing: {out_path}", file=sys.stderr)
        return None
    results = CHECKERS[eval_id](out_path)
    enriched = [{"text": r["text"], "passed": bool(r["passed"]),
                 "evidence": "PASS" if r["passed"] else "FAIL"} for r in results]
    passed = sum(1 for e in enriched if e["passed"])
    total = len(enriched)
    grading = {
        "eval_id": eval_id, "run_kind": run_kind, "expectations": enriched,
        "summary": {"pass_rate": round(passed / total, 4) if total else 0.0,
                     "passed": passed, "failed": total - passed, "total": total},
    }
    run_dir = eval_dir / run_kind / "run-1"
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "grading.json").write_text(json.dumps(grading, ensure_ascii=False, indent=2))
    return grading

def main():
    summary = []
    for eid in sorted(EVAL_DIRS.keys()):
        for kind in RUN_KINDS:
            g = grade_run(eid, kind)
            if g:
                s = g["summary"]
                summary.append({"eval": EVAL_DIRS[eid], "kind": kind,
                                "score": f"{s['passed']}/{s['total']}"})
    print(json.dumps(summary, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
