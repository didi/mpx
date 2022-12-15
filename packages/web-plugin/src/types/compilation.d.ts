import 'webpack'
import { Mpx } from '../types/mpx'

declare module 'webpack' {
  interface Compilation {
    __mpx__: Mpx
  }

  interface NormalModule {
    wxs: boolean
  }
}
