import Event from './event'

export default class CustomEvent extends Event {
  constructor(name = '', options = {}) {
    super({
      name,
      ...options
    })
  }
}