import * as wxLifecycle from './patch/wx/lifecycle'
import * as antLifecycle from './patch/ant/lifecycle'

const lifecycle = typeof wx !== 'undefined' ? wxLifecycle : antLifecycle

export default lifecycle
