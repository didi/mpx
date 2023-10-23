import { isFunction, isObject } from '@mpxjs/utils'

class RefImpl {
  __mpx_isRef = true;
  constructor (value) {
    this._value = value
  }

  get value () {
    return this._value
  }

  set value (newVal) {
    this._value = newVal
  }
}

class GetterRefImpl {
  __mpx_isRef = true;
  __mpx_isReadonly = true;
  constructor (getter) {
    this._getter = getter
  }

  get value () {
    return this._getter()
  }

  set value (newVal) {
    if (__DEV__) {
      console.warn(`getterRef cannot be set: ${String(newVal)}`)
    }
  }
}

class ObjectRefImpl {
  __mpx_isRef = true;
  constructor (source, key, defaultValue) {
    this._object = source
    this._key = key
    this._defaultValue = defaultValue
  }

  get value () {
    const val = this._object[this._key]
    return val === undefined ? this._defaultValue : val
  }

  set value (newVal) {
    this._object[this._key] = newVal
  }
}

export function ref (value) {
  return createRef(value)
}

function createRef (rawValue) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue)
}

export function isRef (value) {
  return !!(value && value.__mpx_isRef)
}

export function unref (ref) {
  return isRef(ref) ? ref.value : ref
}

export function toRef (source, key, defaultValue) {
  if (isRef(source)) {
    return source
  } else if (isFunction(source)) {
    return new GetterRefImpl(source)
  } else if (isObject(source) && arguments.length > 1) {
    return propertyToRef(source, key, defaultValue)
  } else {
    return ref(source)
  }
}

function propertyToRef (source, key) {
  const val = source[key]
  return isRef(val) ? val : new ObjectRefImpl(source, key)
}
