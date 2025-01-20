import { BEFORECREATE, MOUNTED, BEFOREUNMOUNT } from '../../core/innerLifecycle'

const relationTypeMap = {
  parent: 'child',
  ancestor: 'descendant'
}

export default function relationsMixin (mixinType) {
  if (mixinType === 'component') {
    return {
      [BEFORECREATE] () {
        this.__relationNodesMap = {}
      },
      [MOUNTED] () {
        this.__mpxExecRelations('linked')
      },
      [BEFOREUNMOUNT] () {
        this.__mpxExecRelations('unlinked')
        this.__relationNodesMap = {}
      },
      methods: {
        getRelationNodes (path) {
          return this.__relationNodesMap[path] || null
        },
        __mpxExecRelations (type) {
          const relations = this.__mpxProxy.options.relations
          const relationContext = this.__relation
          const currentPath = this.__componentPath
          Object.keys(relations).forEach((path) => {
            const relation = relations[path]
            const relationType = relation.type
            if ((relationType === 'parent' || relationType === 'ancestor') && relationContext[path]) {
              const target = relationContext[path]
              const targetRelation = target.__mpxProxy.options.relations?.[currentPath]
              if (targetRelation && targetRelation.type === relationTypeMap[relationType] && target.__componentPath === path) {
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
                this.__relationNodesMap[path] = [target]
              }
            }
          })
        },
        __mpxLinkRelationNodes (target, path) {
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
