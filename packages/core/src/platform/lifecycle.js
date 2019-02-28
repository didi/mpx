import * as wxLifecycle from './patch/wx/lifecycle'
import * as aliLifecycle from './patch/ali/lifecycle'
import { is } from '../helper/env'
const lifecycle = is('ali') ? aliLifecycle : wxLifecycle

export default lifecycle
