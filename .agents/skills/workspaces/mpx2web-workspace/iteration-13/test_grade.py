from pathlib import Path
import shutil
import tempfile
import unittest
import grade

WORKSPACE = Path(__file__).resolve().parent


def verdicts(rows):
    return {row['id']: row['passed'] for row in rows}


class DeterministicGradeTests(unittest.TestCase):
    def test_route_config_accepts_object_assign(self):
        source = """<script>
mpx.config.webConfig = Object.assign({}, current, {
  routeConfig: Object.assign({}, current.routeConfig, {
    mode: 'history',
    base: '/help-demo/'
  })
})
</script>"""
        self.assertTrue(grade.has_runtime_route_config(source, '/help-demo/'))

    def test_route_config_accepts_direct_runtime_assignment(self):
        source = """<script>
mpx.config.webConfig.routeConfig = {
  mode: 'history',
  base: '/profile-demo/'
}
</script>"""
        self.assertTrue(grade.has_runtime_route_config(source, '/profile-demo/'))

    def test_half_rpx_transform_accepts_direct_and_local_alias(self):
        direct = """transRpxFn: function (match, value) {
  return `${Number(value) / 2}px`
}"""
        aliased = """transRpxFn: function (match, value) {
  const size = Number(value)
  return size === 0 ? '0' : `${size / 2}px`
}"""
        wrong = """transRpxFn: function (match, value) {
  return `${Number(value) / 3}px`
}"""
        self.assertTrue(grade.has_half_rpx_transform(direct))
        self.assertTrue(grade.has_half_rpx_transform(aliased))
        self.assertFalse(grade.has_half_rpx_transform(wrong))

    def test_platform_node_accepts_current_and_legacy_mode_aliases(self):
        source = '<picker @web /><picker @_web /><map @_wx />'
        self.assertEqual(len(grade.platform_open_tags(source, 'picker', 'web')), 2)
        self.assertTrue(grade.has_platform_node(source, 'map', 'wx'))

    def test_on_app_init_accepts_direct_and_shorthand_pinia_injection(self):
        direct = """createApp({
  onAppInit () { return { pinia: createPinia() } }
})"""
        shorthand = """createApp({
  onAppInit () {
    const pinia = createPinia()
    return { pinia }
  }
})"""
        global_only = "const pinia = createPinia(); createApp({})"
        self.assertTrue(grade.on_app_init_injects_pinia(direct))
        self.assertTrue(grade.on_app_init_injects_pinia(shorthand))
        self.assertFalse(grade.on_app_init_injects_pinia(global_only))

    def test_valid_mpx_condition_comments_are_evaluated(self):
        valid = """/* @mpx-if (__mpx_mode__ === 'web') */
.web { display: block; }
/* @mpx-endif */"""
        invalid = """/* @mpx-if (mode === 'web') */
.web { display: block; }
/* @mpx-endif */"""
        self.assertTrue(grade.valid_mpx_conditionals(valid))
        self.assertFalse(grade.valid_mpx_conditionals(invalid))

    def test_web_template_override_can_isolate_wx_handler(self):
        source = """<template><button bindtap="rename">编辑</button></template>
<template mode="web"><button bindtap="openRename">编辑</button></template>"""
        self.assertTrue(grade.handler_isolated_by_web_override(source, 'rename'))

    def test_number_is_finite_is_a_safe_video_fallback(self):
        source = """const detail = Number(event.detail.currentTime)
if (Number.isFinite(detail)) return detail
const target = Number(event.target.currentTime)
return Number.isFinite(target) ? target : 0"""
        self.assertTrue(grade.has_safe_media_fallback(source))

    def test_scopes_preserve_four_cases_and_remove_duplicate_route_assertion(self):
        config = grade.load_config()
        self.assertEqual([len(item['assertions']) for item in config['evals']], [7, 3, 11, 5])
        self.assertEqual(config['evals'][1]['outputs'], ['profile-card.mpx'])
        self.assertEqual(config['evals'][2]['outputs'], ['business-page.mpx'])
        for item in config['evals'][1:3]:
            case = WORKSPACE / f"eval-{item['id']}-{item['name']}"
            self.assertFalse((case / 'input/src').exists())
        self.assertIn('c10', [a['id'] for a in config['evals'][2]['assertions']])

    def test_single_component_can_pass_without_application_files(self):
        source = '''<template>
<view class="custom-class" bindtap="toggle">
  <text class="accent-class">{{title}}</text>
  <text wx:if="{{expanded}}">{{summary}}</text>
</view>
</template>
<script>
import { createComponent } from '@mpxjs/core'
createComponent({
  externalClasses: ['custom-class', 'accent-class'],
  properties: { title: String, summary: String },
  data: { expanded: false },
  methods: { toggle () { this.expanded = !this.expanded } }
})
</script>
<style scoped>.custom-class { padding: 8px; }</style>
<script type="application/json">{ "component": true }</script>
'''
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            card = root / 'profile-card.mpx'
            card.write_text(source)
            self.assertTrue(all(verdicts(grade.check_eval_1(root)).values()))
            card.write_text(source.replace('this.expanded = !this.expanded', 'this.setData({ expanded: !this.expanded })'))
            self.assertFalse(verdicts(grade.check_eval_1(root))['n3'])
            card.write_text(source.replace('class="accent-class"', 'class="title"'))
            self.assertFalse(verdicts(grade.check_eval_1(root))['n2'])

    def test_input_page_exposes_web_differences_but_keeps_state_chain(self):
        root = WORKSPACE / 'eval-2-api-component-adaptation/input'
        result = verdicts(grade.check_eval_2(root))
        self.assertTrue(result['c9'])
        self.assertTrue(all(not result[key] for key in result if key != 'c9'))

    def test_platform_guard_cannot_leak_between_merged_features(self):
        json_source = '''const config = { usingComponents: { 'native-scanner': './native-scanner.mpx' } }
if (__mpx_mode__ === 'wx') {
  config.usingComponents['foo-card'] = 'plugin://foo/component'
}
module.exports = config'''
        self.assertTrue(grade.wx_only_reference(json_source, 'plugin://foo/component'))
        self.assertFalse(grade.wx_only_reference(json_source, 'native-scanner'))

    def test_scanner_and_plugin_are_checked_on_the_page_with_readonly_dependency(self):
        source = '''<template>
<view>
  <native-scanner @wx bindresult="onScanResult" />
  <foo-card @wx />
  <!-- TODO(web): 接入扫码 SDK，复用 onScanResult -->
</view>
</template>
<script>createPage({ methods: {} })</script>
<script name="json">
const config = { usingComponents: {} }
if (__mpx_mode__ === 'wx') {
  config.usingComponents['native-scanner'] = './native-scanner.mpx'
  config.usingComponents['foo-card'] = 'plugin://foo/component'
}
module.exports = config
</script>'''
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copyfile(WORKSPACE / 'eval-2-api-component-adaptation/input/native-scanner.mpx', root / 'native-scanner.mpx')
            (root / 'business-page.mpx').write_text(source)
            result = verdicts(grade.check_eval_2(root))
            self.assertTrue(result['c2'])
            self.assertTrue(result['c5'])
            (root / 'native-scanner.mpx').write_text('modified dependency')
            self.assertFalse(verdicts(grade.check_eval_2(root))['c2'])

    def test_share_moves_to_page_and_requires_its_own_isolation(self):
        source = '''<script>
const options = {}
if (__mpx_mode__ === 'wx') {
  options.onShareAppMessage = function () {
    return { title: '业务详情', path: '/pages/business/index' }
  }
}
// TODO(web): 接入分享协议
createPage(options)
</script>'''
        self.assertTrue(grade.share_isolated_for_web(source))
        self.assertFalse(grade.share_isolated_for_web(source.replace("__mpx_mode__ === 'wx'", "__mpx_mode__ === 'web'")))
        self.assertFalse(grade.share_isolated_for_web(source.replace('/pages/business/index', '/wrong/path')))

    def test_application_inputs_keep_only_required_runtime_chains(self):
        root = WORKSPACE / 'eval-0-style-config-adaptation/input'
        app = grade.read(root, 'src/app.mpx')
        self.assertNotIn('workers', app)
        self.assertNotIn('packageB', app)
        self.assertNotIn('pages/style', app)
        home = grade.read(root, 'src/pages/home/index.mpx')
        self.assertIn('equal-row', home)
        self.assertIn('openChoice', home)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            shutil.copytree(root, output, dirs_exist_ok=True)
            for name in ('red-card', 'blue-card'):
                card = output / f'src/components/{name}.mpx'
                card.write_text(card.read_text().replace('<style>', '<style scoped>'))
            self.assertTrue(verdicts(grade.check_eval_0(output))['s0'])
        result = verdicts(grade.check_eval_3(WORKSPACE / 'eval-3-ssr-state-adaptation/input'))
        self.assertFalse(result['r1'])
        self.assertFalse(result['r2'])


if __name__ == '__main__':
    unittest.main()
