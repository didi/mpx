<script>

const data = [
  {
    text: '全局配置',
    items: [
      {
        link: 'app-config',
        text: '',
        headers: [
          {
            text: 'useStrictDiff',
            anchor: '#useStrictDiff'
          },
          {
            text: 'ignoreWarning',
            anchor: '#ignoreWarning'
          },
          {
            text: 'ignoreProxyWhiteList',
            anchor: '#ignoreProxyWhiteList'
          },
          {
            text: 'observeClassInstance',
            anchor: '#observeClassInstance'
          },
          {
            text: 'proxyEventHandler',
            anchor: '#proxyEventHandler'
          },
          {
            text: 'setDataHandler',
            anchor: '#setDataHandler'
          },
          {
            text: 'forceFlushSync',
            anchor: '#forceFlushSync'
          },
          {
            text: 'webRouteConfig',
            anchor: '#webRouteConfig'
          },
          {
            text: 'webConfig',
            anchor: '#webConfig'
          },
        ]
      }
    ]
  },
  {
    text: '全局 API',
    items: [
      {
        link: 'global-api',
        text: '全局对象 Mpx',
        headers: [
          {
            text: 'mixin',
            anchor: '#mixin'
          },
          {
            text: 'injectMixins',
            anchor: '#injectMixins'
          },
          {
            text: 'observable',
            anchor: '#observable'
          },
          {
            text: 'set',
            anchor: '#set'
          },
          {
            text: 'delete',
            anchor: '#delete'
          },
          {
            text: 'use',
            anchor: '#use'
          },
          {
            text: 'watch',
            anchor: '#watch'
          },
        ]
      },
      {
        link: 'global-api',
        text: '基础 API',
        headers: [
          {
            text: 'createApp',
            anchor: '#createApp'
          },
          {
            text: 'createPage',
            anchor: '#createPage'
          },
          {
            text: 'createComponent',
            anchor: '#createComponent'
          },
          {
            text: 'nextTick',
            anchor: '#nextTick'
          },
          {
            text: 'toPureObject',
            anchor: '#toPureObject'
          },
          {
            text: 'getMixin',
            anchor: '#getMixin'
          },
          {
            text: 'implement',
            anchor: '#implement'
          }
        ]
      },
      {
        link: 'global-api',
        text: '内建生命周期变量',
        headers: [
          {
            text: 'BEFORECREATE',
            anchor: '#BEFORECREATE'
          },
          {
            text: 'CREATED',
            anchor: '#CREATED'
          },
          {
            text: 'BEFOREMOUNT',
            anchor: '#BEFOREMOUNT'
          },
          {
            text: 'MOUNTED',
            anchor: '#MOUNTED'
          },
          {
            text: 'BEFOREUPDATE',
            anchor: '#BEFOREUPDATE'
          },
          {
            text: 'UPDATED',
            anchor: '#UPDATED'
          },
          {
            text: 'BEFOREUNMOUNT',
            anchor: '#BEFOREUNMOUNT'
          },
          {
            text: 'UNMOUNTED',
            anchor: '#UNMOUNTED'
          },
          {
            text: 'ONLOAD',
            anchor: '#ONLOAD'
          },
          {
            text: 'ONSHOW',
            anchor: '#ONSHOW'
          },
          {
            text: 'ONHIDE',
            anchor: '#ONHIDE'
          },
          {
            text: 'ONRESIZE',
            anchor: '#ONRESIZE'
          }
        ]
      },
      {
        link: 'store-api',
        text: 'Store API',
        headers: [
          {
            text: 'createStore',
            anchor: '#createStore'
          },
          {
            text: 'createStoreWithThis',
            anchor: '#createStoreWithThis'
          },
          {
            text: 'createStateWithThis',
            anchor: '#createStateWithThis'
          },
          {
            text: 'createGettersWithThis',
            anchor: '#createGettersWithThis'
          },
          {
            text: 'createMutationsWithThis',
            anchor: '#createMutationsWithThis'
          },
          {
            text: 'createActionsWithThis',
            anchor: '#createActionsWithThis'
          }
        ]
      }
    ]
  },
  {
    text: '响应式 API',
    items: [
      {
        link: 'reactivity-api',
        text: '响应式基础 API',
        headers: [
          {
            text: 'set',
            anchor: '#set'
          },
          {
            text: 'del',
            anchor: '#del'
          },
          {
            text: 'reactive',
            anchor: '#reactive'
          },
          {
            text: 'isReactive',
            anchor: '#isReactive'
          },
          {
            text: 'markRaw',
            anchor: '#markRaw'
          },
          {
            text: 'shallowReactive',
            anchor: '#shallowReactive'
          },
        ]
      },
      {
        link: 'reactivity-api',
        text: 'Refs',
        headers: [
          {
            text: 'ref',
            anchor: '#ref'
          },
          {
            text: 'unref',
            anchor: '#unref'
          },
          {
            text: 'toRef',
            anchor: '#toRef'
          },
          {
            text: 'toRefs',
            anchor: '#toRefs'
          },
          {
            text: 'isRef',
            anchor: '#isRef'
          },
          {
            text: 'customRef',
            anchor: '#customRef'
          },
          {
            text: 'shallowRef',
            anchor: '#shallowRef'
          },
          {
            text: 'triggerRef',
            anchor: '#triggerRef'
          }
        ]
      },
      {
        link: 'reactivity-api',
        text: 'Computed 与 Watch',
        headers: [
          {
            text: 'computed',
            anchor: '#computed'
          },
          {
            text: 'watchEffect',
            anchor: '#watchEffect'
          },
          {
            text: 'watchSyncEffect',
            anchor: '#watchSyncEffect'
          },
          {
            text: 'watchPostEffect',
            anchor: '#watchPostEffect'
          },
          {
            text: 'watch',
            anchor: '#watch'
          }
        ]
      },
      {
        link: 'reactivity-api',
        text: 'Effect 作用域 API',
        headers: [
          {
            text: 'effectScope',
            anchor: '#effectScope'
          },
          {
            text: 'getCurrentScope',
            anchor: '#getCurrentScope'
          },
          {
            text: 'onScopeDispose',
            anchor: '#onScopeDispose'
          }
        ]
      },
    ]
  },
  {
    text: '组合式 API',
    items: [
      {
        link: 'composition-api',
        text: '生命周期钩子',
        headers: [
          {
            text: 'onBeforeMount',
            anchor: '#onBeforeMount'
          },
          {
            text: 'onMounted',
            anchor: '#onMounted'
          },
          {
            text: 'onBeforeUpdate',
            anchor: '#onBeforeUpdate'
          },
          {
            text: 'onUpdated',
            anchor: '#onUpdated'
          },
          {
            text: 'onBeforeUnmount',
            anchor: '#onBeforeUnmount'
          },
          {
            text: 'onUnmount',
            anchor: '#onUnmount'
          },
          {
            text: 'onLoad',
            anchor: '#onLoad'
          },
          {
            text: 'onShow',
            anchor: '#onShow'
          },
          {
            text: 'onHide',
            anchor: '#onHide'
          },
          {
            text: 'onResize',
            anchor: '#onResize'
          },
          {
            text: 'onPullDownRefresh',
            anchor: '#onPullDownRefresh'
          },
          {
            text: 'onReachBottom',
            anchor: '#onReachBottom'
          },
          {
            text: 'onShareAppMessage',
            anchor: '#onShareAppMessage'
          },
          {
            text: 'onShareTimeline',
            anchor: '#onShareTimeline'
          },
          {
            text: 'onAddToFavorites',
            anchor: '#onAddToFavorites'
          },
          {
            text: 'onPageScroll',
            anchor: '#onPageScroll'
          },
          {
            text: 'onTabItemTap',
            anchor: '#onTabItemTap'
          },
          {
            text: 'onSaveExitState',
            anchor: '#onSaveExitState'
          },
        ]
      },
      {
        link: 'composition-api',
        text: '其他',
        headers: [
          {
            text: 'setup',
            anchor: '#setup'
          },
          {
            text: 'getCurrentInstance',
            anchor: '#getCurrentInstance'
          },
          {
            text: 'useI18n',
            anchor: '#useI18n'
          },
          {
            text: 'useFetch',
            anchor: '#useFetch'
          },
          {
            text: 'provide',
            anchor: '#provide'
          },
          {
            text: 'inject',
            anchor: '#inject'
          }
        ]
      }
    ]
  },
  {
    text: '选项式 API',
    items: [
      {
        link: 'instance-api',
        text: '实例 API',
        headers: [
          {
            text: '$set',
            anchor: '#$set'
          },
          {
            text: '$watch',
            anchor: '#$watch'
          },
          {
            text: '$delete',
            anchor: '#$delete'
          },
          {
            text: '$refs',
            anchor: '#$refs'
          },
          {
            text: '$asyncRefs',
            anchor: '#$asyncRefs'
          },
          {
            text: '$forceUpdate',
            anchor: '#$forceUpdate'
          },
          {
            text: '$nextTick',
            anchor: '#$nextTick'
          },
          {
            text: '$i18n',
            anchor: '#$i18n'
          },
          {
            text: '$rawOptions',
            anchor: '#$rawOptions'
          },
        ]
      }
    ]
  },
  {
    text: '内置相关',
    items: [
      {
        link: 'directives',
        text: '模版指令 (1)',
        headers: [
          {
            text: 'wx:if',
            anchor: '#wx-if'
          },
          {
            text: 'wx:elif',
            anchor: '#wx-elif'
          },
          {
            text: 'wx:else',
            anchor: '#wx-else'
          },
          {
            text: 'wx:for',
            anchor: '#wx-for'
          },
          {
            text: 'wx:for-index',
            anchor: '#wx-for-index'
          },
          {
            text: 'wx:for-item',
            anchor: '#wx-for-item'
          },
          {
            text: 'wx:key',
            anchor: '#wx-key'
          },
          {
            text: 'wx:class',
            anchor: '#wx-class'
          },
          {
            text: 'wx:style',
            anchor: '#wx-style'
          }
        ]
      },
      {
        link: 'directives',
        text: '模版指令 (2)',
        headers: [
          {
            text: 'wx:model',
            anchor: '#wx-model'
          },
          {
            text: 'wx:model-prop',
            anchor: '#wx-model-prop'
          },
          {
            text: 'wx:model-event',
            anchor: '#wx-model-event'
          },
          {
            text: 'wx:model-value-path',
            anchor: '#wx-model-value-path'
          },
          {
            text: 'wx:model-filter',
            anchor: '#wx-model-filter'
          },
          {
            text: 'wx:ref',
            anchor: '#wx-ref'
          },
          {
            text: 'wx:show',
            anchor: '#wx-show'
          },
          {
            text: 'bind',
            anchor: '#bind'
          },
          {
            text: 'catch',
            anchor: '#catch'
          },
          {
            text: 'capture-bind',
            anchor: '#capture-bind'
          },
          {
            text: 'capture-catch',
            anchor: '#capture-catch'
          },
        ]
      },
      {
        link: 'builtIn',
        text: '内建组件',
        headers: [
          {
            text: 'component',
            anchor: '#component'
          },
          {
            text: 'slot',
            anchor: '#slot'
          }
        ]
      }
    ]
  },
  {
    text: '编译构建',
    items: [
      {
        link: 'compile',
        text: 'webpack 配置',
        headers: [
          {
            text: 'output.publicPath',
            anchor: '#output-publicPath'
          },
          {
            text: 'output.filename',
            anchor: '#output-filename'
          },
          {
            text: 'node.global',
            anchor: '#node-global'
          },
          {
            text: 'rule.resourceQuery',
            anchor: '#rule-resourceQuery'
          },
          {
            text: 'resolve.extensions',
            anchor: '#resolve-extensions'
          }
        ]
      },
      {
        link: 'compile',
        text: 'MpxWebpackPlugin options (1)',
        headers: [
          {
            text: 'mode',
            anchor: '#mode'
          },
          {
            text: 'srcMode',
            anchor: '#srcMode'
          },
          {
            text: 'modeRules',
            anchor: '#modeRules'
          },
          {
            text: 'externalClasses',
            anchor: '#externalClasses'
          },
          {
            text: 'resolveMode',
            anchor: '#resolveMode'
          },
          {
            text: 'projectRoot',
            anchor: '#projectRoot'
          },
          {
            text: 'writeMode',
            anchor: '#writeMode'
          },
          {
            text: 'autoScopeRules',
            anchor: '#autoScopeRules'
          },
          {
            text: 'catch',
            anchor: '#catch'
          },
          {
            text: 'forceDisableProxyCtor',
            anchor: '#forceDisableProxyCtor'
          },
          {
            text: 'transMpxRules',
            anchor: '#transMpxRules'
          },
        ]
      },
      {
        link: 'compile',
        text: 'MpxWebpackPlugin options (2)',
        headers: [
          {
            text: 'forceProxyEventRules',
            anchor: '#forceProxyEventRules'
          },
          {
            text: 'autoSplit',
            anchor: '#autoSplit'
          },
          {
            text: 'defs',
            anchor: '#defs'
          },
          {
            text: 'attributes',
            anchor: '#attributes'
          },
          {
            text: 'externals',
            anchor: '#externals'
          },
          {
            text: 'miniNpmPackage',
            anchor: '#miniNpmPackage'
          },
          {
            text: 'forceUsePageCtor',
            anchor: '#forceUsePageCtor'
          },
          {
            text: 'transRpxRules',
            anchor: '#transRpxRules'
          },
          {
            text: 'postcssInlineConfig',
            anchor: '#postcssInlineConfig'
          },
          {
            text: 'decodeHTMLText',
            anchor: '#decodeHTMLText'
          },
          {
            text: 'nativeConfig',
            anchor: '#nativeConfig'
          },
          {
            text: 'webConfig',
            anchor: '#webConfig'
          },
          {
            text: 'i18n',
            anchor: '#i18n'
          },
          {
            text: 'auditResource',
            anchor: '#auditResource'
          },
          {
            text: 'subpackageModulesRules',
            anchor: '#subpackageModulesRules'
          },
          {
            text: 'generateBuildMap',
            anchor: '#generateBuildMap'
          },
          {
            text: 'autoVirtualHostRules',
            anchor: '#autoVirtualHostRules'
          },
          {
            text: 'partialCompileRules',
            anchor: '#partialCompileRules'
          },
        ]
      },
      {
        link: 'compile',
        text: 'MpxWebpackPlugin static methods',
        headers: [
          {
            text: 'MpxWebpackPlugin.loader',
            anchor: '#mpxwebpackplugin-loader'
          },
          {
            text: 'MpxWebpackPlugin.pluginLoader',
            anchor: '#mpxwebpackplugin-pluginloader'
          },
          {
            text: 'MpxWebpackPlugin.wxsPreLoader',
            anchor: '#mpxwebpackplugin-wxspreloader'
          },
          {
            text: 'MpxWebpackPlugin.fileLoader',
            anchor: '#mpxwebpackplugin-fileloader'
          },
          {
            text: 'MpxWebpackPlugin.urlLoader',
            anchor: '#mpxwebpackplugin-urlloader'
          }
        ]
      },
      {
        link: 'compile',
        text: 'Request query',
        headers: [
          {
            text: '?resolve',
            anchor: '#resolve'
          },
          {
            text: '?root',
            anchor: '#root'
          },
          {
            text: '?fallback',
            anchor: '#fallback'
          },
          {
            text: '?useLocal',
            anchor: '#useLocal'
          },
          {
            text: '?isStyle',
            anchor: '#isStyle'
          },
          {
            text: '?isPage',
            anchor: '#isPage'
          },
          {
            text: '?isComponent',
            anchor: '#isComponent'
          },
          {
            text: '?async',
            anchor: '#async'
          }
        ]
      },
    ]
  },
  {
    text: '周边拓展',
    items: [
      {
        link: 'extend',
        text: '@mpxjs/fetch',
        headers: [
          {
            text: 'fetch',
            anchor: '#fetch'
          },
          {
            text: 'CancelToken',
            anchor: '#CancelToken'
          },
          {
            text: 'XFetch',
            anchor: '#XFetch'
          },
          {
            text: 'interceptors',
            anchor: '#interceptors'
          },
          {
            text: 'proxy 代理',
            anchor: '#proxy'
          },
          {
            text: 'useFetch',
            anchor: '#useFetch'
          }
        ]
      },
      {
        link: 'extend',
        text: '其他',
        headers: [
          {
            text: 'api-proxy',
            anchor: '#api-proxy'
          },
          {
            text: 'webview-bridge',
            anchor: '#webview-bridge'
          },
          {
            text: 'size-report',
            anchor: '#size-report'
          },
          {
            text: 'i18n',
            anchor: '#i18n'
          }
        ]
      }
    ]
  }
]

const normalize = (s) => s.toLowerCase().replace(/-/g, ' ')

export default {
  data() {
    return {
      query: ''
    }
  },
  computed: {
    filtered() {
      const q = normalize(this.query)
      const matches = (text) => normalize(text).includes(q)
      return data
          .map((section) => {
            // section title match
            if (matches(section.text)) {
              return section
            }

            // filter groups
            const matchedGroups = section.items
                .map((item) => {
                  // group title match
                  if (matches(item.text)) {
                    return item
                  }
                  // filter headers
                  const matchedHeaders = item.headers.filter(
                      ({ text, anchor }) => matches(text) || matches(anchor)
                  )
                  return matchedHeaders.length
                      ? { text: item.text, link: item.link, headers: matchedHeaders }
                      : null
                })
                .filter((i) => i)

            return matchedGroups.length
                ? { text: section.text, items: matchedGroups }
                : null
          })
          .filter((i) => i)
    }
  },
  methods: {
    slugify(text) {
      return text
          // Replace special characters
          .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g, '-')
          // Remove continuous separators
          .replace(/\-{2,}/g, '-')
          // Remove prefixing and trailing separators
          .replace(/^\-+|\-+$/g, '')
          // ensure it doesn't start with a number (#121)
          .replace(/^(\d)/, '_$1')
          // lowercase
          .toLowerCase()
    }
  }
}
</script>

<template>
  <div id="api-index">
    <div class="header">
      <h1>API 参考</h1>
      <div class="api-filter">
        <label for="api-filter">过滤</label>
        <input
            type="search"
            placeholder="输入关键字"
            id="api-filter"
            v-model="query"
        />
      </div>
    </div>

    <div
        v-for="section of filtered"
        :key="section.text"
        class="api-section"
    >
      <h2 :id="slugify(section.text)">{{ section.text }}</h2>
      <div class="api-groups">
        <div
            v-for="item of section.items"
            :key="item.text"
            class="api-group"
        >
          <h3 v-if="item.text">{{ item.text }}</h3>
          <ul>
            <li v-for="h of item.headers" :key="h.anchor">
              <a :href="item.link + '.html#' + slugify(h.anchor)">{{ h.text }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="!filtered.length" class="no-match">
      没有匹配到 API "{{ query }}"
    </div>
  </div></template>

<style scoped>
#api-index {
  max-width: 1024px;
  margin: 0px auto;
  padding: 64px 32px;
}
a{
  text-decoration: none;
}

h1,
h2,
h3 {
  font-weight: 600;
  line-height: 1;
}

h1,
h2 {
  letter-spacing: -0.02em;
}

h1 {
  font-size: 38px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

h2 {
  font-size: 24px;
  color: var(--vp-c-text-1);
  margin: 36px 0;
  transition: color 0.5s;
  padding-top: 36px;
  border-top: 1px solid var(--vt-c-divider-light);
  border-bottom: none;
}

h3 {
  letter-spacing: -0.01em;
  color: var(--vt-c-green);
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 1em;
  transition: color 0.5s;
}

.api-section {
  margin-bottom: 64px;
}

.api-groups a {
  font-size: 15px;
  font-weight: 500;
  line-height: 2;
  color: var(--vt-c-text-code);
  transition: color 0.5s;
}

.api-groups a:hover {
  color: var(--vt-c-green);
  transition: none;
}

.api-group {
  break-inside: avoid;
  overflow: auto;
  margin-bottom: 20px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 24px 18px;
  transition: background-color 0.5s;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.api-filter {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
}

.api-filter input {
  border: 1px solid var(--vt-c-divider);
  border-radius: 8px;
  padding: 6px 12px;
}

#api-filter:focus {
  box-shadow: 0 0 4pt #00d47499;
}

.no-match {
  font-size: 1.2em;
  color: var(--vt-c-text-3);
  text-align: center;
  margin-top: 36px;
  padding-top: 36px;
  border-top: 1px solid var(--vt-c-divider-light);
}

@media (max-width: 768px) {
  #api-index {
    padding: 42px 24px;
  }
  h1 {
    font-size: 32px;
    margin-bottom: 24px;
  }
  h2 {
    font-size: 22px;
    margin: 42px 0 32px;
    padding-top: 32px;
  }
  .api-groups a {
    font-size: 14px;
  }
  .header {
    display: block;
  }
}

@media (min-width: 768px) {
  .api-groups {
    columns: 2;
  }
}

@media (min-width: 1024px) {
  .api-groups {
    columns: 3;
  }
}
</style>
