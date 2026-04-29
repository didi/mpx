const compiler = require('../../lib/template-compiler/compiler')
const templateShared = require('../../lib/web/template-shared')
const { MPX_TEMPLATE_COMPONENT_PREFIX } = require('../../lib/utils/const')

function createWebParseOptions (overrides = {}) {
  const error = jest.fn()
  const warn = jest.fn()
  return Object.assign(
    {
      mode: 'web',
      srcMode: 'wx',
      defs: {},
      usingComponentsInfo: {},
      externalClasses: [],
      filePath: 'test/template/web-tpl.mpx',
      warn,
      error
    },
    overrides
  )
}

describe('Web template support (compiler + template-shared)', () => {
  describe('compiler.parse / serialize', () => {
    it('collects import src into meta.imports and removes import from serialized tree', () => {
      const opts = createWebParseOptions()
      const { root, meta } = compiler.parse(
        '<import src="./part.wxml" />\n<view>main</view>',
        opts
      )
      expect(meta.imports).toEqual(['./part.wxml'])
      expect(compiler.serialize(root)).toBe('<div>main</div>')
      expect(opts.error).not.toHaveBeenCalled()
    })

    it('stores <template name> in meta.templates and strips definition from main tree', () => {
      const opts = createWebParseOptions()
      const { root, meta } = compiler.parse(
        '<template name="msgItem"><view>{{msg}}</view></template><view>main</view>',
        opts
      )
      expect(meta.templates).toBeDefined()
      expect(meta.templates.msgItem).toBeDefined()
      expect(meta.templates.msgItem.attrsMap.name).toBe('msgItem')
      const html = compiler.serialize(root)
      expect(html).toContain('<div>main</div>')
      expect(html).not.toMatch(/<template/)
    })

    it('replaces static <template is> with mpx-tpl-* self-closing tag', () => {
      const opts = createWebParseOptions()
      const { root } = compiler.parse(
        '<template name="msgItem"><view>x</view></template><template is="msgItem" />',
        opts
      )
      expect(compiler.serialize(root)).toBe(`<${MPX_TEMPLATE_COMPONENT_PREFIX}msgItem/>`)
    })

    it('accepts wx-style data="{{...d}}" on <template is> (same as RN template usage)', () => {
      const opts = createWebParseOptions()
      const { root } = compiler.parse(
        '<template name="msgItem"><view>x</view></template><template is="msgItem" data="{{...d}}" />',
        opts
      )
      const html = compiler.serialize(root)
      expect(html).toBe(
        `<${MPX_TEMPLATE_COMPONENT_PREFIX}msgItem :mpx-data="({...d})"/>`
      )
      expect(opts.error).not.toHaveBeenCalled()
    })

    it('resolves dynamic <template is> and data="{{...d}}" (same parse path as RN)', () => {
      const opts = createWebParseOptions()
      const { root } = compiler.parse(
        '<template name="msgItem"><view>x</view></template><template is="{{tplName}}" data="{{...d}}" />',
        opts
      )
      const html = compiler.serialize(root)
      expect(html).toBe(
        `<component :is="'${MPX_TEMPLATE_COMPONENT_PREFIX}' + ((tplName))" :mpx-data="({...d})"/>`
      )
      expect(opts.error).not.toHaveBeenCalled()
    })

    it('keeps wx:if and other attrs on <template is> after replacement (v-if + mpx-tpl)', () => {
      const opts = createWebParseOptions()
      const { root } = compiler.parse(
        '<template name="msgItem"><view>x</view></template><template is="msgItem" wx:if="{{show}}" class="a" />',
        opts
      )
      const html = compiler.serialize(root)
      expect(html).toMatch(new RegExp(`^<${MPX_TEMPLATE_COMPONENT_PREFIX}msgItem`))
      expect(html).toContain('v-if=')
      expect(html).toContain('show')
      expect(html).toMatch(/:class=| class=/)
      expect(html).toContain('a')
      expect(opts.error).not.toHaveBeenCalled()
    })

    it('reports duplicated template name', () => {
      const opts = createWebParseOptions()
      compiler.parse(
        '<template name="dup"></template><template name="dup"></template>',
        opts
      )
      expect(opts.error).toHaveBeenCalledWith(
        expect.stringContaining('Duplicated template name "dup"')
      )
    })
  })

  describe('template-shared', () => {
    it('getWxTemplateComponentName matches const prefix', () => {
      expect(templateShared.getWxTemplateComponentName('foo')).toBe(
        MPX_TEMPLATE_COMPONENT_PREFIX + 'foo'
      )
    })

    it('serializeWxTemplateDefinition concatenates serialized children (inner fragment only)', () => {
      const opts = createWebParseOptions()
      const { meta } = compiler.parse(
        '<template name="inner"><view class="a">t</view></template>',
        opts
      )
      const tplNode = meta.templates.inner
      const emitError = jest.fn()
      const frag = templateShared.serializeWxTemplateDefinition(tplNode, emitError, 'inner')
      expect(frag).toContain('<div')
      expect(frag).toContain('t')
      expect(frag).not.toMatch(/<template\b/)
      expect(emitError).not.toHaveBeenCalled()
    })

    it('serializeWxTemplateDefinition emits error when template body has multiple element roots', () => {
      const opts = createWebParseOptions()
      const { meta } = compiler.parse(
        '<template name="bad"><view>a</view><view>b</view></template>',
        opts
      )
      const emitError = jest.fn()
      templateShared.serializeWxTemplateDefinition(meta.templates.bad, emitError, 'bad')
      expect(emitError).toHaveBeenCalledWith(
        expect.stringContaining('Web mode does not support multi-root template definition "bad"')
      )
    })
  })
})
