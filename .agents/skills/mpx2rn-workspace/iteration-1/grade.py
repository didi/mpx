#!/usr/bin/env python3
"""Grade outputs from each subagent run against per-eval assertions.

Each output is a .mpx SFC (template/script/style/json blocks).
We run regex-based checks and write grading.json into each run dir.
"""
import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent

# ---------- block extraction ----------

def extract_blocks(src: str):
    """Return dict with template, script, style, json text (concatenated)."""
    blocks = {"template": "", "script": "", "style": "", "json": ""}

    def grab_all(tag):
        return re.findall(
            rf"<{tag}(?:\s[^>]*)?>(.*?)</{tag}>",
            src, re.DOTALL | re.IGNORECASE
        )

    blocks["template"] = "\n".join(grab_all("template"))
    blocks["style"] = "\n".join(grab_all("style"))

    # script may have type="application/json" → goes to json
    for m in re.finditer(
        r"<script(?P<attrs>(?:\s[^>]*)?)>(?P<body>.*?)</script>",
        src, re.DOTALL | re.IGNORECASE
    ):
        attrs = (m.group("attrs") or "").lower()
        body = m.group("body")
        if 'type="application/json"' in attrs or 'name="json"' in attrs:
            blocks["json"] += "\n" + body
        else:
            blocks["script"] += "\n" + body
    return blocks


def strip_comments(text: str) -> str:
    """Strip /* ... */ block comments (CSS/JS)."""
    return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)


def strip_rn_conditional_blocks(style: str) -> str:
    """Remove style blocks that are RN-only @mpx-if; what's left is the
    code that runs on original (wx/web) platforms. Useful for inverse
    checks, but we mostly use a wx-only stripper instead."""
    # Drop `/* @mpx-if (... ios/android/harmony ...) */ ... /* @mpx-endif */`
    return re.sub(
        r"/\*\s*@mpx-if[^*]*?(ios|android|harmony)[^*]*?\*/.*?/\*\s*@mpx-endif\s*\*/",
        "",
        style, flags=re.DOTALL | re.IGNORECASE,
    )


def strip_wx_conditional_blocks(text: str) -> str:
    """Remove blocks that are wx/ali/web-only conditional compile.
    What's left is what gets emitted on RN."""
    return re.sub(
        r"/\*\s*@mpx-if[^*]*?(wx|ali|web)[^*]*?\*/.*?/\*\s*@mpx-(endif|end-if)\s*\*/",
        "",
        text, flags=re.DOTALL | re.IGNORECASE,
    )


# ---------- generic checks ----------

def has_less_nesting(style_text: str) -> bool:
    """Detect less/scss nested rules: a selector appearing inside an open block.
    Heuristic: any line that is indented and starts with `&` or a selector
    char (`.` `#` ` ` ` ` ` `) followed by `{` before closing brace, while
    we're already inside a block."""
    text = strip_comments(style_text)
    # Quick check: presence of `&` selector character (less-only)
    if "&" in text:
        return True
    # Walk char by char tracking depth
    depth = 0
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif depth >= 1 and c == "\n":
            # peek next non-ws
            j = i + 1
            while j < n and text[j] in " \t":
                j += 1
            # if next non-ws is selector-ish followed by {, we have a nested rule
            if j < n and text[j] not in "}{\n":
                # find next `{` or `}` or `;`
                k = j
                while k < n and text[k] not in "{};":
                    k += 1
                if k < n and text[k] == "{":
                    return True
        i += 1
    return False


def has_empty_rules(style_text: str) -> bool:
    """Detect selector { /* nothing */ } after stripping comments."""
    text = strip_comments(style_text)
    return bool(re.search(r"[^{}]+\{\s*\}", text))


def uses_wrong_endif(text: str) -> bool:
    """The correct sentinel is /* @mpx-endif */; some folks write @mpx-end-if."""
    return "@mpx-end-if" in text


# ---------- per-eval checks ----------

def check_eval_0(output_path: Path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_clean = strip_comments(blocks["style"])

    results = []

    results.append({
        "text": "style: no less nesting (& or rule-in-rule)",
        "passed": not has_less_nesting(blocks["style"]),
    })
    results.append({
        "text": "style on RN (wx-conditional stripped): no `:active`",
        "passed": ":active" not in strip_comments(style_rn),
    })
    results.append({
        "text": "style on RN: no `:first-child`",
        "passed": ":first-child" not in strip_comments(style_rn),
    })
    results.append({
        "text": "script: replaced wx.request with mpx.request",
        "passed": ("wx.request" not in blocks["script"])
                  and ("mpx.request" in blocks["script"]),
    })
    results.append({
        "text": "script: replaced wx.navigateTo with mpx.navigateTo",
        "passed": ("wx.navigateTo" not in blocks["script"])
                  and ("mpx.navigateTo" in blocks["script"]),
    })
    results.append({
        "text": "script: uses e.currentTarget.dataset (not e.target.dataset)",
        "passed": ("e.currentTarget.dataset" in blocks["script"])
                  and ("e.target.dataset" not in blocks["script"]),
    })
    results.append({
        "text": "template: dynamic class via wx:class (not class string interp)",
        "passed": not re.search(
            r'(?<![:\-\w])class\s*=\s*"[^"]*\{\{[^"]*\}\}[^"]*"',
            blocks["template"]),
    })
    results.append({
        "text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
        "passed": not uses_wrong_endif(src),
    })
    results.append({
        "text": "style: no empty selector rules after stripping comments",
        "passed": not has_empty_rules(blocks["style"]),
    })
    return results


def check_eval_1(output_path: Path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_clean = strip_comments(blocks["style"])

    results = []

    uses_setup = bool(re.search(r"<script\s+setup", src, re.IGNORECASE)) or \
                 bool(re.search(r"\bsetup\s*\(", blocks["script"]))
    results.append({"text": "uses composition API (script setup or setup())", "passed": uses_setup})

    results.append({"text": "style: no nesting / compound selectors",
                    "passed": not has_less_nesting(blocks["style"])
                    and not re.search(r"\.[\w-]+\s+\.[\w-]+\s*\{",
                                       style_clean)})

    results.append({
        "text": "uses hover-class for press feedback (not bare :active on root)",
        "passed": "hover-class" in blocks["template"]
                  and ":active" not in strip_comments(style_rn),
    })

    results.append({
        "text": "triggerEvent('tap', ...) is called",
        "passed": bool(re.search(
            r"triggerEvent\s*\(\s*['\"]tap['\"]", blocks["script"])),
    })

    results.append({
        "text": "title uses numberOfLines for ellipsis",
        "passed": "numberOfLines" in blocks["template"],
    })

    results.append({
        "text": "avatar uses <image> (not <img>)",
        "passed": "<image" in blocks["template"] and "<img" not in blocks["template"],
    })

    results.append({
        "text": "text content wrapped in <text> elements",
        "passed": "<text" in blocks["template"],
    })

    results.append({
        "text": "defineProps uses Mpx-style `value:` (not Vue-style `default:`)",
        "passed": "value:" in blocks["script"] and "default:" not in blocks["script"],
    })

    results.append({
        "text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
        "passed": not uses_wrong_endif(src),
    })
    return results


def check_eval_2(output_path: Path):
    src = output_path.read_text()
    blocks = extract_blocks(src)
    style_rn = strip_wx_conditional_blocks(blocks["style"])
    style_rn_clean = strip_comments(style_rn)

    results = []

    results.append({"text": "style: no less nesting outside of conditional compile",
                    "passed": not has_less_nesting(strip_wx_conditional_blocks(blocks["style"]))})

    results.append({
        "text": "style on RN: no ::before pseudo-element",
        "passed": "::before" not in style_rn_clean and ":before" not in re.sub(
            r"::before", "", style_rn_clean),
    })

    results.append({
        "text": "style on RN: no `display: grid`",
        "passed": not re.search(r"display\s*:\s*grid", style_rn_clean),
    })

    results.append({
        "text": "style on RN: no `:active` pseudo-class",
        "passed": ":active" not in style_rn_clean,
    })

    results.append({
        "text": "style on RN: no `+` adjacent sibling combinator",
        "passed": not re.search(r"\.[\w-]+\s*\+\s*\.[\w-]+", style_rn_clean),
    })

    results.append({
        "text": "conditional compile uses @mpx-endif (not @mpx-end-if)",
        "passed": not uses_wrong_endif(src),
    })

    results.append({
        "text": "style: numeric font-weight (e.g. 600) replaced with bold/normal",
        "passed": not re.search(r"font-weight\s*:\s*[1-9]\d{2}", style_rn_clean),
    })

    results.append({
        "text": "template: real node added to replace ::before (e.g. card-decorator/card-bar)",
        "passed": bool(re.search(r"card-(decorator|bar)", blocks["template"])),
    })

    results.append({
        "text": "style: no empty selector rules",
        "passed": not has_empty_rules(blocks["style"]),
    })
    return results


CHECKERS = {0: check_eval_0, 1: check_eval_1, 2: check_eval_2}

EVAL_DIRS = {
    0: "eval-0-adapt-list-page",
    1: "eval-1-create-card-component",
    2: "eval-2-adapt-style-block",
}

OUTPUT_FILES = {
    0: "list.mpx",
    1: "card.mpx",
    2: "style-block.mpx",
}


def grade_run(eval_id: int, run_kind: str):
    eval_dir = WORKSPACE / EVAL_DIRS[eval_id]
    out_path = eval_dir / run_kind / "outputs" / OUTPUT_FILES[eval_id]
    if not out_path.exists():
        print(f"missing: {out_path}", file=sys.stderr)
        return None
    results = CHECKERS[eval_id](out_path)
    # add evidence
    enriched = []
    for r in results:
        enriched.append({
            "text": r["text"],
            "passed": bool(r["passed"]),
            "evidence": "PASS" if r["passed"] else "FAIL",
        })
    passed = sum(1 for e in enriched if e["passed"])
    total = len(enriched)
    grading = {
        "eval_id": eval_id,
        "run_kind": run_kind,
        "expectations": enriched,
        "summary": {
            "pass_rate": round(passed / total, 4) if total else 0.0,
            "passed": passed,
            "failed": total - passed,
            "total": total,
        },
    }
    run_dir = eval_dir / run_kind / "run-1"
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "grading.json").write_text(
        json.dumps(grading, ensure_ascii=False, indent=2))
    return grading


def main():
    summary = []
    for eid in (0, 1, 2):
        for kind in ("with_skill", "without_skill"):
            g = grade_run(eid, kind)
            if g:
                s = g["summary"]
                summary.append({
                    "eval": EVAL_DIRS[eid],
                    "kind": kind,
                    "score": f"{s['passed']}/{s['total']}",
                })
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
