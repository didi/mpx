import * as wxLifecycle from './patch/wx/lifecycle'
import * as aliLifecycle from './patch/ali/lifecycle'

const lifecycle = typeof wx !== 'undefined' ? wxLifecycle : aliLifecycle

export default lifecycle
