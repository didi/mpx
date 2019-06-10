import { type } from '../../helper/utils'
import { is } from '../../helper/env'

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
  if (is('ali') && mixinType === 'component') {
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
                  const childrenType = type(child.props.children)
                  if (childrenType === 'Object' || childrenType === 'Array') {
                    const slotChildren = childrenType !== 'Array' ? [child.props.children] : child.props.children
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
  }
}
