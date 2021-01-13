import { isObject } from '../../helper/utils'

const targets = []
let curTarget = null

function pushTarget (cur) {
  targets.push(curTarget)
  curTarget = cur
}

function popTarget () {
  curTarget = targets.pop()
}

function parsePath (path, absolute) {
  if (path.indexOf('/') === 0) {
    return path
  }
  const dirs = absolute.split('/').slice(0, -1)
  let relatives = path.split('/')
  relatives = relatives.filter(path => {
    if (path === '..') {
      dirs.pop()
      return false
    } else {
      return path !== '.'
    }
  })
  return dirs.concat(relatives).join('/')
}

function transferPath (relations, base) {
  const newRelations = {}
  Object.keys(relations).forEach(key => {
    newRelations[parsePath(key, base)] = relations[key]
  })
  return newRelations
}

export default function relationsMixin (mixinType) {
  if (__mpx_mode__ === 'ali' && mixinType === 'component') {
    return {
      methods: {
        getRelationNodes (path) {
          const realPath = parsePath(path, this.is)
          return (this.$relationNodesMap && this.$relationNodesMap[realPath]) || []
        },
        mpxCollectChildComponent (children, list) {
          if (this.$mpxRelations) {
            children.forEach(child => {
              if (child && child.props) {
                if (child.props.$isCustomComponent) {
                  // 只有relations中声明为后代的节点才能被作为有效子节点
                  let relation = this.$mpxRelations[child.type.displayName]
                  if (relation && (relation.type === 'child' || relation.type === 'descendant')) {
                    child.props.$mpxIsSlot = true
                    list.push(child)
                  }
                } else {
                  const children = child.props.children
                  if (isObject(children)) {
                    const slotChildren = Array.isArray(children) ? children : [children]
                    this.mpxCollectChildComponent(slotChildren, list)
                  }
                }
              }
            })
          }
        },
        mpxSlotNotify () {
          if (this.mpxSlotLinkNum < this.mpxSlotChildren.length) {
            this.mpxSlotLinkNum++
            if (this.mpxSlotLinkNum === this.mpxSlotChildren.length) {
              popTarget()
            }
          }
        },
        mpxExecAllRelations (type) {
          this.mpxRelationContexts.forEach(context => {
            context.mpxExecRelation(this, type)
            this.mpxExecRelation(context, type)
          })
        },
        mpxExecRelation (target, type) {
          this.mpxCacheRelationNode(target, type)
          const relations = this.$mpxRelations || {}
          const path = target.is
          if (relations[path]) {
            typeof relations[path][type] === 'function' && relations[path][type].call(this, target)
          }
        },
        mpxCacheRelationNode (target, type) {
          const path = target.is
          const nodes = this.$relationNodesMap[path] || []
          if (type === 'linked') {
            nodes.push(target)
          } else {
            const index = nodes.indexOf(target)
            index > -1 && nodes.splice(index, 1)
          }
          this.$relationNodesMap[path] = nodes
        },
        mpxGetRelation (child) {
          const parentRelations = this.$mpxRelations || {}
          const childRelations = child.$mpxRelations || {}
          if (parentRelations[child.is] && childRelations[this.is]) {
            const parentType = parentRelations[child.is].type
            const childType = childRelations[this.is].type
            return {
              parentType,
              childType
            }
          }
        },
        mpxPropagateFindRelation (child) {
          let cur = this
          let contexts = []
          let depth = 1
          // 向上查找所有可能匹配的父级relation上下文
          while (cur) {
            const relations = cur.mpxGetRelation(child)
            if (relations) {
              if ((relations.parentType === 'child' && relations.childType === 'parent' && depth === 1) ||
                (relations.parentType === 'descendant' && relations.childType === 'ancestor')) {
                contexts.push(cur)
              }
            }
            cur = cur.mpxSlotParent
            depth++
          }
          return contexts
        }
      },
      onInit () {
        if (this.$rawOptions.relations) {
          this.$mpxRelations = transferPath(this.$rawOptions.relations, this.is)
          this.$relationNodesMap = {}
        }
        if (curTarget && this.props.$mpxIsSlot) {
          this.mpxSlotParent = curTarget // slot 父级
          if (this.$mpxRelations) {
            const contexts = curTarget.mpxPropagateFindRelation(this) // relation 父级|祖先
            if (contexts) {
              this.mpxRelationContexts = contexts
              this.mpxExecAllRelations('linked')
            }
          }
        }
      },
      deriveDataFromProps (nextProps) {
        this.mpxSlotParent && this.mpxSlotParent.mpxSlotNotify() // 通知slot父级，确保父级能执行popTarget
        const slots = nextProps.$slots || {}
        const slotKeys = Object.keys(slots)
        if (slotKeys.length) {
          this.mpxSlotChildren = []
          this.mpxSlotLinkNum = 0
          slotKeys.forEach(key => {
            this.mpxCollectChildComponent(slots[key], this.mpxSlotChildren)
          })
          if (this.mpxSlotChildren.length) {
            pushTarget(this)
          }
        }
      },
      didUnmount () {
        if (this.mpxRelationContexts) {
          this.mpxExecAllRelations('unlinked')
        }
      }
    }
  } else if (__mpx_mode__ === 'web' && mixinType === 'component') {
    return {
      created () {
        this.$mpxRelations = this.$rawOptions.relations
        this.__mpxRelationsVNodeMaps = {}
      },
      mounted () {
        this.__mpxCollectAllComponent()
        this.__mpxRelationExec('linked')
      },
      beforeDestroy () {
        this.__mpxRelationExec('unlinked')
      },
      methods: {
        __mpxCollectAllComponent () {
          if (!this.$mpxRelations) {
            return
          }
          Object.keys(this.$mpxRelations).forEach(path => {
            let type = this.$mpxRelations[path].type
            if (type === 'parent' || type === 'ancestor') { // 向上查找
              this.__mpxRelationsVNodeMaps[path] = {}
              this.__mpxCollectParentComponent(path, this.$parent, this, this.__mpxRelationsVNodeMaps[path])
            }
          })
        },
        __mpxCollectParentComponent (parentPath, $parent, child, list) {
          if (parentPath && !list.parent) {
            let target = $parent.$options.mpxCid === parentPath ? $parent : ''
            if (target) {
              if (!target.cacheSlotComInstance.has(child)) {
                target.__mpxFindSlotChilds.call(target) // 如果缓存中没有目标组件，则需更新下 cacheSlotComInstance
              }
              if (target.cacheSlotComInstance.has(child)) {
                let relations = target.$mpxRelations[child.$options.mpxCid] || {}
                if (relations.type === 'child' || relations.type === 'descendant') {
                  list.parent = target
                  list.child = child
                }
              }
            }
          }
        },
        __mpxFindSlotChilds () { // 收集slot中所有组件实例
          Object.keys(this.$slots).forEach(slotKey => {
            this.$slots[slotKey].forEach(vNode => {
              if (vNode.componentInstance) {
                this.cacheSlotComInstance.add(vNode.componentInstance)
              } else if (vNode.children) {
                vNode.children.forEach(item => {
                  this.__mpxDepsSearchSlotChild(item, this.cacheSlotComInstance)
                })
              }
            })
          })
        },
        __mpxDepsSearchSlotChild (child, cache) { // 深度遍历，查找slot下所有一级子级组件
          if (child.componentInstance) {
            cache.add(child.componentInstance)
          } else if (child.children) {
            child.children.forEach(item => {
              this.__mpxDepsSearchSlotChild(item, cache)
            })
          }
        },
        __mpxRelationExec (type) {
          Object.keys(this.__mpxRelationsVNodeMaps).forEach(path => {
            let context = this.__mpxRelationsVNodeMaps[path]
            let { parent, child } = context
            if (parent && child) {
              let parentRelations = parent.$mpxRelations[child.$options.mpxCid]
              if (typeof parentRelations[type] === 'function') {
                parentRelations[type].call(parent, child)
              }
              let childRelations = child.$mpxRelations[parent.$options.mpxCid]
              if (typeof childRelations[type] === 'function') {
                childRelations[type].call(child, parent)
              }
            }
          })
        }
      }
    }
  }
}
