const COMPONENT_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeDestroy',
  'destroyed',
  'errorCaptured'
]

export const LIFECYCLE = {
  APP_HOOKS: COMPONENT_HOOKS,
  PAGE_HOOKS: COMPONENT_HOOKS,
  COMPONENT_HOOKS
}
