import {
  variantAria,
  variantTaggedAriaAttributes,
  variantChildren,
  variantCombinators,
  variantContainerQuery,
  variantTaggedDataAttributes,
  variantLanguageDirections,
  variantStartingStyle,
  variantSupports,
  variantSelector,
  variantCssLayer,
  variantScope
} from '@unocss/preset-mini/variants'
import {
  variantCombinators as windVariantCombinator,
  variantContrasts,
  variantMotions,
  variantSpaceAndDivide,
  variantStickyHover,
  placeholderModifier
} from '@unocss/preset-wind/variants'

const wrapVariant = function (variant = {}) {
  return function (raw) {
    const ctx = {
      rawSelector: raw,
      theme: this.config,
      generator: this
    }
    let match
    if (typeof variant === 'function') {
      match = variant
    } else if (variant.match) {
      match = variant.match
    } else {
      return
    }
    if (match(raw, ctx)) {
      this._mpx2rnUnsuportedRules = this._mpx2rnUnsuportedRules || []
      this._mpx2rnUnsuportedRules.push(raw)
      return true
    }
  }
}

const transformVariants = function (variantsArr) {
  return variantsArr.map(variants => {
    if (Array.isArray(variants)) {
      return variants.map(variant => wrapVariant(variant))
    } else {
      return wrapVariant(variants)
    }
  }).reduce((preV, curV) => {
    if (Array.isArray(curV)) {
      return preV.concat(...curV)
    } else {
      return preV.concat(curV)
    }
  }, [])
}

export default transformVariants([
  variantAria,
  variantTaggedAriaAttributes,
  variantChildren,
  variantCombinators,
  variantContainerQuery,
  variantTaggedDataAttributes,
  variantLanguageDirections,
  variantStartingStyle,
  variantSupports,
  variantSelector,
  variantCssLayer,
  variantScope,
  windVariantCombinator,
  variantContrasts,
  variantMotions,
  variantSpaceAndDivide,
  variantStickyHover,
  placeholderModifier
])
