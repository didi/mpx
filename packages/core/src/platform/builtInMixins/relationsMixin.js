import { isObject } from '../../helper/utils'
import { CREATED, MOUNTED } from '../../core/innerLifecycle'

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

const relationTypeMap = {
  parent: 'child',
  ancestor: 'descendant'
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
      [CREATED] () {
        this.__mpxRelations = {}
      },
      [MOUNTED] () {
        this.__mpxCollectRelations()
        this.__mpxExecRelations('linked')
      },
      beforeDestroy () {
        this.__mpxExecRelations('unlinked')
      },
      methods: {
        __mpxCollectRelations () {
          const relations = this.$rawOptions.relations
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
            const targetRelation = target.$rawOptions && target.$rawOptions.relations && target.$rawOptions.relations[this.$options.mpxCid]
            if (
              targetRelation &&
              targetRelation.type === relationTypeMap[type] &&
              target.$options.mpxCid === path
            ) {
              // 当前匹配成功
              this.__mpxRelations[path] = {
                target,
                targetRelation,
                relation
              }
            } else if (type === 'ancestor') {
              // 当前匹配失败，但type为ancestor时，继续向上查找
              return this.__mpxCheckParent(target, relation, path)
            }
          }
        },
        __mpxExecRelations (type) {
          Object.keys(this.__mpxRelations).forEach(path => {
            const { target, targetRelation, relation } = this.__mpxRelations[path]
            if (typeof targetRelation[type] === 'function') {
              targetRelation[type].call(target, this)
            }
            if (typeof relation[type] === 'function') {
              relation[type].call(this, target)
            }
          })
        }
      }
    }
  }
}
