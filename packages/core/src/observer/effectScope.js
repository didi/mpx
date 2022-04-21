
export function recordEffectScope (effect, scope) {
  if (scope && scope.active) scope.effects.push(effect)
}
