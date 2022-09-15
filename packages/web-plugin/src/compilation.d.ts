import 'webpack'
import Mpx from './mpx'

declare module 'webpack' {
  interface Compilation {
    __mpx__: Mpx
  }

  interface NormalModule {
    wxs: boolean
  }
}
