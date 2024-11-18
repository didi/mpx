import { BEFORECREATE, MOUNTED, BEFOREUNMOUNT } from '../../core/innerLifecycle'

const relationTypeMap = {
  parent: 'child',
  ancestor: 'descendant'
}

export default function relationsMixin (mixinType) {
  if (__mpx_mode__ === 'web' && mixinType === 'component') {
    return {
      [BEFORECREATE] () {
        this.__mpxRelations = {}
        this.__mpxRelationNodesMap = {} // 用于getRelationNodes关系查询
      },
      [MOUNTED] () {
        this.__mpxCollectRelations()
        this.__mpxExecRelations('linked')
      },
      [BEFOREUNMOUNT] () {
        this.__mpxExecRelations('unlinked')
        // 重置缓存数据
        this.__mpxRelations = {}
        this.__mpxRelationNodesMap = {}
      },
      methods: {
        getRelationNodes (path) {
          return this.__mpxRelationNodesMap[path] || null
        },
        __mpxCollectRelations () {
          const relations = this.__mpxProxy.options.relations
          if (!relations) return
          Object.keys(relations).forEach(path => {
            const relation = relations[path]
            // 向上查找parent是否为relation目标
            this.__mpxCheckParent(this, relation, path)
          })
        },
        __mpxCheckParent (current, relation, path) {
          const type = relation.type
          const target = current.$parent
          if (!target) return

          // target为内建组件时，直接跳过，继续向上查找
          if (target.$options.__mpxBuiltIn) {
            return this.__mpxCheckParent(target, relation, path)
          }

          // 当前组件在target的slots当中
          if ((type === 'parent' || type === 'ancestor') && target.$vnode.context === this.$vnode.context) {
            const targetRelation = target?.__mpxProxy.options.relations?.[this.$options.componentPath]
            if (
              targetRelation &&
              targetRelation.type === relationTypeMap[type] &&
              target.$options.componentPath === path
            ) {
              // 当前匹配成功
              this.__mpxRelations[path] = {
                target,
                targetRelation,
                relation
              }
              this.__mpxRelationNodesMap[path] = [target] // 子级绑定父级
            } else if (type === 'ancestor') {
              // 当前匹配失败，但type为ancestor时，继续向上查找
              return this.__mpxCheckParent(target, relation, path)
            }
          }
        },
        __mpxExecRelations (type) {
          Object.keys(this.__mpxRelations).forEach(path => {
            const { target, targetRelation, relation } = this.__mpxRelations[path]
            const currentPath = this.$options.componentPath
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
          target.__mpxRelationNodesMap[path] = target.__mpxRelationNodesMap[path] || [] // 父级绑定子级
          target.__mpxRelationNodesMap[path].push(this)
        },
        __mpxRemoveRelationNodes (target, path) {
          const arr = target.__mpxRelationNodesMap[path] || []
          const index = arr.indexOf(this)
          if (index !== -1) arr.splice(index, 1)
        }
      }
    }
  }
}
