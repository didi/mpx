import { injectMixins, mergeInjectedMixins, clearInjectMixins } from '../../src/core/injectMixins'

describe('InjectMixins should work right', () => {
  beforeEach(() => {
    clearInjectMixins()
  })

  it('Default inject should be inserted before', () => {
    injectMixins({
      index: 0
    }, 'page')
    injectMixins({
      index: 1
    })

    const options = {
      mixins: [{
        index: 2
      }]
    }
    mergeInjectedMixins(options, 'page')
    expect(options.mixins.length).toEqual(3)
    options.mixins.forEach((mixin, i) => {
      expect(mixin.index).toEqual(i)
    })

    const options2 = {
      mixins: [{
        index: 0
      }]
    }
    mergeInjectedMixins(options2, 'component')
    expect(options2.mixins.length).toEqual(2)
  })

  it('Inject with plus stage should be inserted after', () => {
    injectMixins({
      index: 1
    }, {
      stage: 1,
      types: 'page'
    })
    const options = {
      mixins: [{
        index: 0
      }]
    }
    mergeInjectedMixins(options, 'page')
    expect(options.mixins.length).toEqual(2)
    options.mixins.forEach((mixin, i) => {
      expect(mixin.index).toEqual(i)
    })

    const options2 = {
      mixins: [{
        index: 0
      }]
    }
    mergeInjectedMixins(options2, 'component')
    expect(options2.mixins.length).toEqual(1)
  })

  it('Inject with stage multiply should be inserted with right order', () => {
    injectMixins({
      index: 5
    }, {
      stage: 100,
      types: ['page']
    })
    injectMixins({
      index: 4
    }, {
      stage: 50,
      types: 'page'
    })

    injectMixins([
      {
        index: 1
      }, {
        index: 2
      }
    ], {
      stage: -100,
      types: ['page']
    })

    injectMixins([
      {
        index: 0
      }
    ], {
      stage: -1000,
      types: ['page']
    })

    const options = {
      mixins: [{
        index: 3
      }]
    }

    mergeInjectedMixins(options, 'page')
    expect(options.mixins.length).toEqual(6)
    options.mixins.forEach((mixin, i) => {
      expect(mixin.index).toEqual(i)
    })
  })
})
