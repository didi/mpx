import { MOUNTED, BEFOREUNMOUNT } from '../../core/innerLifecycle'

export default function relationsMixin (mixinType) {
  if (mixinType === 'component') {
    return {
      [MOUNTED] () {
        if (this.__relations) {
          this.__mpxExecRelations('linked')
        }
      },
      [BEFOREUNMOUNT] () {
        if (this.__relations) {
          this.__mpxExecRelations('unlinked')
          this.__relations = {}
        }
        if (this.__relationNodesMap) {
          this.__relationNodesMap = {}
        }
      },
      methods: {
        getRelationNodes (path) {
          return this.__relationNodesMap?.[path] || null
        },
        __mpxExecRelations (type) {
          const relations = this.__relations
          Object.keys(relations).forEach(path => {
            const { target, targetRelation, relation } = relations[path]
            const currentPath = this.__componentPath
            if (type === 'linked') {
              this.__mpxLinkRelationNodes(target, currentPath)
            } else if (type === 'unlinked') {
              this.__mpxRemoveRelationNodes(target, currentPath)
            }
            if (typeof targetRelation[type] === 'function') {
              targetRelation[type].call(target, this)
            }
            if (typeof relation[type] === 'function') {
              relation[type].call(this, target)
            }
          })
        },
        __mpxLinkRelationNodes (target, path) {
          if (!target.__relationNodesMap) {
            target.__relationNodesMap = {}
          }
          target.__relationNodesMap[path] = target.__relationNodesMap[path] || [] // 父级绑定子级
          target.__relationNodesMap[path].push(this)
        },
        __mpxRemoveRelationNodes (target, path) {
          const relationNodesMap = target.__relationNodesMap
          const arr = relationNodesMap[path] || []
          const index = arr.indexOf(this)
          if (index !== -1) arr.splice(index, 1)
        }
      }
    }
  }
}
