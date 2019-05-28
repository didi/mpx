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

export default function relationsMixin () {
  if (is('ali')) {
    return {
      methods: {
        collectChildComponent (children, list) {
          children.forEach(child => {
            if (child && child.props) {
              if (child.props.$isCustomComponent) {
                list.push(child)
              } else {
                const childrenType = type(child.props.children)
                if (childrenType === 'Object' || childrenType === 'Array') {
                  const slotChildren = childrenType !== 'Array' ? [child.props.children] : child.props.children
                  this.collectChildComponent(slotChildren, list)
                }
              }
            }
          })
        },
        notify () {
          if (this.mpxSlotLinkNum < this.mpxSlotChildren.length) {
            this.mpxSlotLinkNum++
            if (this.mpxSlotLinkNum === this.mpxSlotChildren.length) {
              popTarget()
            }
          }
        },
        execAllRelations (type) {
          this.mpxRelationContexts.forEach(context => {
            context.execRelation(this, type)
            this.execRelation(context, type)
          })
        },
        execRelation (target, type) {
          const relations = this.$mpxRelations || {}
          const path = target.is
          if (relations[path]) {
            typeof relations[path][type] === 'function' && relations[path][type].call(this, target)
          }
        },
        getRelation (child) {
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
        propagateFind (child) {
          let cur = this
          let contexts = []
          let depth = 1
          // 向上查找所有可能匹配的父级relation上下文
          while (cur) {
            const relations = cur.getRelation(child)
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
        }
        if (curTarget) {
          this.mpxSlotParent = curTarget // slot 父级
          if (this.$mpxRelations) {
            const contexts = curTarget.propagateFind(this) // relation 父级|祖先
            if (contexts) {
              this.mpxRelationContexts = contexts
              this.execAllRelations('linked')
            }
          }
        }
      },
      deriveDataFromProps (nextProps) {
        this.mpxSlotParent && this.mpxSlotParent.notify() // 通知slot父级，确保父级能执行popTarget
        if (this.$mpxRelations) {
          const slots = nextProps.$slots || {}
          this.mpxSlotChildren = []
          this.mpxSlotLinkNum = 0
          Object.keys(slots).forEach(key => {
            this.collectChildComponent(slots[key], this.mpxSlotChildren)
          })
          if (this.mpxSlotChildren.length) {
            pushTarget(this)
          }
        }
      },
      didUnmount () {
        if (this.mpxRelationContexts) {
          this.execAllRelations('unlinked')
        }
      }
    }
  }
}
