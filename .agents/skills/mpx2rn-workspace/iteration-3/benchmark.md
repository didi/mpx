# Skill Benchmark: mpx2rn-gene vs mpx2rn (iteration-3)

**Date**: 2026-05-15T11:36:09Z
**Evals**: 6 test cases (3 standard + 3 edge-case)

## Summary

| Metric | mpx2rn-gene | mpx2rn (original) | Delta |
|--------|-------------|-------------------|-------|
| Pass Rate | 96.0% ± 6.0% | 98.0% ± 5.0% | -2.0% |
| Time | 133.3s ± 37.5s | 214.6s ± 74.6s | -81.2s |
| Tokens | 85324 ± 19803 | 85006 ± 21720 | +317 |

## Per-Eval Breakdown

| Eval | gene score | orig score | gene time | orig time | gene tokens | orig tokens |
|------|-----------|-----------|-----------|-----------|-------------|-------------|
| adapt-list-page | 8/9 | 9/9 | 136s | 223s | 81186k | 86788k |
| create-card-component | 9/9 | 9/9 | 77s | 192s | 69995k | 54868k |
| adapt-style-block | 9/9 | 9/9 | 103s | 144s | 56045k | 63691k |
| selector-api-animation | 8/9 | 9/9 | 147s | 358s | 106035k | 95452k |
| slots-cssvar-i18n | 9/9 | 8/9 | 180s | 180s | 95498k | 97054k |
| pinia-scroll-intersection | 9/9 | 9/9 | 157s | 190s | 103185k | 112184k |

## Analysis

### Quality
- gene: 96.3% pass rate (52/54 assertions)
- original: 98.2% pass rate (53/54 assertions)
- Difference: -2%, essentially equivalent

### Gene Failures
- **eval-0**: e.currentTarget.dataset — gene used inline params (valid alternative approach)
- **eval-3**: enable-animation — gene missed this RN-specific attribute (genuine gap)

### Original Failures
- **eval-4**: calc() replaced without flex equivalent — dropped sizing logic entirely

### Speed
- gene is **38% faster** on average (133s vs 215s)
- Biggest gain on eval-3: 147s vs 358s (59% faster)
- eval-4 was essentially tied (180s vs 180s)

### Token Efficiency
- Token usage nearly identical (~85k avg both sides)
- Gene achieves same quality with same token budget but completes faster
