import importlib.util
import tempfile
import unittest
from pathlib import Path


WORKSPACE = Path(__file__).parent
SPEC = importlib.util.spec_from_file_location("grade", WORKSPACE / "grade.py")
GRADE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GRADE)


def check(checker, assertion_id, source):
    with tempfile.TemporaryDirectory() as directory:
        output_path = Path(directory) / "fixture.mpx"
        output_path.write_text(source)
        return next(
            result["passed"]
            for result in checker(output_path)
            if result["id"] == assertion_id
        )




class CalibratedScoringTest(unittest.TestCase):
    def test_pseudo_background_color_matches_actual_node(self):
        source = '.card::before { height: 4rpx; background-color: #1677ff; }'
        output = '.decoration { height: 4rpx; background-color: #1677ff; }'
        template = '<view class="decoration" />'
        self.assertTrue(GRADE.has_pseudo_view_replacement(source, template, output))
        self.assertFalse(GRADE.has_pseudo_view_replacement(
            source, template, output.replace('#1677ff', 'red')))
        self.assertFalse(GRADE.has_pseudo_view_replacement(source, '<view />', output))

    def test_wrapper_is_identified_by_parent_relationship(self):
        template = '<view class="stats-section"><view class="spacing-cell"><view class="stat-card" /></view></view>'
        style = '<style>.stats-section { display:flex; }.spacing-cell { padding:16rpx 24rpx; }</style>'
        self.assertTrue(check(GRADE.check_eval_4, 'l12', '<template>' + template + '</template>' + style))
        unrelated = '<view class="stats-section"><view class="spacing-cell" /><view class="stat-card" /></view>'
        self.assertFalse(check(GRADE.check_eval_4, 'l12', '<template>' + unrelated + '</template>' + style))

    def test_proxy_factory_and_binding_aliases(self):
        for factory in ('getProxy', 'makeApi'):
            imported = 'getProxy' if factory == 'getProxy' else 'getProxy as makeApi'
            script = f"import {{ {imported} }} from '@mpxjs/api-proxy'; const host = {factory}(); host.request({{}})"
            for checker, key in ((GRADE.check_eval_1, 't5'), (GRADE.check_eval_2, 'j0')):
                with self.subTest(factory=factory, key=key):
                    self.assertTrue(check(checker, key, '<script>' + script + '</script>'))
                    self.assertFalse(check(checker, key, '<script>' + script + '; wx.request({})</script>'))
            self.assertFalse(GRADE.uses_api_proxy(script.replace('@mpxjs/api-proxy', 'other-api')))
            self.assertFalse(GRADE.uses_api_proxy(script.replace('host.request({})', '')))

    def test_supported_share_hook_must_be_reachable_on_rn(self):
        hook = 'Object.assign(options, { onShareAppMessage () { return {} } })'
        for prefix, expected in (('', True), ("if (__mpx_mode__ === 'ios')", True),
                                 ("if (__mpx_mode__ !== 'ios')", False)):
            with self.subTest(prefix=prefix):
                source = '<script>' + (prefix + ' { ' + hook + ' }' if prefix else hook) + '</script>'
                self.assertEqual(check(GRADE.check_eval_2, 'j9', source), expected)
        self.assertFalse(check(GRADE.check_eval_2, 'j9', '<script>const options = {}</script>'))
        for value in ('function () { return {} }', '() => ({})'):
            source = f'<script>const options = {{ onShareAppMessage: {value} }}</script>'
            self.assertTrue(check(GRADE.check_eval_2, 'j9', source))
            source = f"<script>if (__mpx_mode__ !== 'ios') {{ const options = {{ onShareAppMessage: {value} }} }}</script>"
            self.assertFalse(check(GRADE.check_eval_2, 'j9', source))

    def test_plain_distinct_keys_pass_but_same_or_other_platform_keys_fail(self):
        source = '<template><view wx:if="{{show}}" class="toast-mask" key="a"/><view wx:else class="toast-placeholder" key="b"/></template>'
        self.assertTrue(check(GRADE.check_eval_3, 'g10', source))
        self.assertFalse(check(GRADE.check_eval_3, 'g10', source.replace('key="b"', 'key="a"')))
        self.assertFalse(check(GRADE.check_eval_3, 'g10', source.replace('key=', 'key@android=')))
        self.assertTrue(check(GRADE.check_eval_3, 'g10', source.replace('key=', 'key="same" key@ios=')))
        self.assertFalse(check(GRADE.check_eval_3, 'g10', source.replace('key="a"', 'key="a" key@ios="same"').replace('key="b"', 'key="b" key@ios="same"')))

    def test_click_opacity_uses_css_cascade_and_inline_styles(self):
        template = '<view class="mask visible" bindtap="close" />'
        for styles, expected in (
            ('.mask{opacity:0}.visible{opacity:1}', True),
            ('.visible{opacity:1}.mask{opacity:0}', False),
            ('.mask{opacity:0.05}', True),
            ('.unrelated{opacity:0}.mask{opacity:1}', True),
        ):
            with self.subTest(styles=styles):
                self.assertEqual(check(GRADE.check_eval_3, 'g8', f'<template>{template}</template><style>{styles}</style>'), expected)
        self.assertFalse(check(GRADE.check_eval_3, 'g8', '<template><view style="opacity:0" bindtap="close"/></template>'))
        self.assertTrue(check(GRADE.check_eval_3, 'g8', '<template><view style="opacity:0.05" bindtap="close"/></template>'))

    def test_click_opacity_allows_hidden_to_visible_transition(self):
        source = '''<template><view wx:style="{{motion}}" bindtap="open" /></template>
<script>const motion = computed(() => { return { opacity: ready.value ? 1 : 0 } })</script>'''
        self.assertTrue(check(GRADE.check_eval_3, 'g8', source))
        self.assertFalse(check(GRADE.check_eval_3, 'g8', source.replace('ready.value ? 1 : 0', '0')))
        self.assertTrue(check(GRADE.check_eval_3, 'g8', source.replace('wx:style="{{motion}}"', '')))
        self.assertTrue(check(GRADE.check_eval_3, 'g8', source.replace('? 1 : 0', '? 1 : 0.4')))
        isolated = source.replace('return { opacity:', "if (__mpx_mode__ !== 'ios') { return { opacity:").replace('1 : 0 }', '1 : 0 } } return {}')
        self.assertTrue(check(GRADE.check_eval_3, 'g8', isolated))

    def test_click_opacity_merges_classes_active_in_displayed_state(self):
        template = """<view wx:if="{{show}}" class="mask"
          wx:class="{{ { 'visible': show } }}" bindtap="close" />"""
        styles = '.mask{opacity:0}.visible{opacity:1}'
        for node, css, expected in (
            (template, styles, True),
            (template.replace("'visible'", 'visible'), styles, True),
            (template.replace(': show', ': true'), styles, True),
            (template.replace(': show', ': false'), styles, False),
            (template.replace(': show', ': other'), styles, False),
            (template.replace(': show', ': !show'), styles, False),
            (template.replace('wx:if="{{show}}"', ''), styles, False),
            (template, '.visible{opacity:1}.mask{opacity:0}', False),
            (template.replace('bindtap=', 'style="opacity:0" bindtap='), styles, False),
            (template, '.mask{opacity:1}.visible{opacity:0}', False),
        ):
            with self.subTest(template=node, styles=css):
                source = f'<template>{node}</template><style>{css}</style>'
                self.assertEqual(check(GRADE.check_eval_3, 'g8', source), expected)

    def test_decoded_category_accepts_default_callback_parameters(self):
        for parameters in ('raw, decoded = raw', 'query = {}, parsed = query',
                           'query, parsed = {}'):
            raw, decoded = [p.split('=')[0].strip() for p in parameters.split(',')]
            for callback in (f'({parameters}) =>', f'function ({parameters})'):
                source = f'<script setup>onLoad({callback} {{ selectCategory({decoded}.category) }})</script>'
                with self.subTest(callback=callback):
                    self.assertTrue(check(GRADE.check_eval_8, 'a2', source))
                    self.assertFalse(check(GRADE.check_eval_8, 'a2', source.replace(
                        f'{decoded}.category', f'{raw}.category')))
                    self.assertFalse(check(GRADE.check_eval_8, 'a2', source.replace(
                        f'{decoded}.category', f'({raw} || {decoded}).category')))
                    self.assertFalse(check(GRADE.check_eval_8, 'a2', source.replace(
                        'onLoad(', 'setTimeout(() => { onLoad(').replace('})</script>', '}) })</script>')))

    def test_dynamic_component_names_may_live_in_template(self):
        source = '''<template><component is="{{readonly ? 'rating-readonly-tip' : 'rating-editable-tip'}}" range="rating-editable-tip,rating-readonly-tip" /></template><script>createComponent({})</script>'''
        self.assertTrue(check(GRADE.check_eval_6, 'n13', source))
        self.assertFalse(check(GRADE.check_eval_6, 'n13', source.replace('range="rating-editable-tip,rating-readonly-tip"', 'range="rating-editable-tip"')))
        self.assertFalse(check(GRADE.check_eval_6, 'n13', source.replace("{{readonly ? 'rating-readonly-tip' : 'rating-editable-tip'}}", 'rating-editable-tip')))

    def test_decoded_category_uses_callback_parameters_and_precedence(self):
        for expression in ('decoded.category', '(decoded || raw).category', '(decoded ?? raw).category'):
            source = f'<script setup>onLoad((raw = {{}}, decoded) => {{ selectCategory({expression}) }})</script>'
            self.assertTrue(check(GRADE.check_eval_8, 'a2', source), expression)
        for expression in ('raw.category', '(raw || decoded).category'):
            source = f'<script setup>onLoad((raw, decoded) => {{ selectCategory({expression}) }})</script>'
            self.assertFalse(check(GRADE.check_eval_8, 'a2', source), expression)
        self.assertFalse(check(GRADE.check_eval_8, 'a2', '<script>const decodedQuery = {}; decodedQuery.category</script>'))
        self.assertFalse(check(GRADE.check_eval_8, 'a2', '<script>setTimeout(() => { onLoad((raw, decoded) => { selectCategory(decoded.category) }) })</script>'))

    def test_scroll_handler_uses_effective_platform_tag_and_attributes(self):
        source = '<view mpxTagName@ios="scroll-view" scroll-y@ios bindscrolltolower@ios="loadMore" />'
        self.assertTrue(GRADE.has_scroll_loading_handler(source))
        self.assertTrue(GRADE.has_scroll_loading_handler(source.replace('@ios', '@ios|android')))
        self.assertFalse(GRADE.has_scroll_loading_handler(source.replace('bindscrolltolower@ios', 'bindscrolltolower@wx')))
        self.assertFalse(GRADE.has_scroll_loading_handler(source.replace('mpxTagName@ios', 'mpxTagName@wx')))
        self.assertFalse(GRADE.has_scroll_loading_handler('<view bindscrolltolower="loadMore"/><scroll-view />'))
