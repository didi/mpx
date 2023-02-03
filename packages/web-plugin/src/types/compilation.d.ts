import { MpxWithOptions } from 'src/mpx'
import 'webpack'

declare module 'webpack' {
  interface Compilation {
    __mpx__: MpxWithOptions
  }

  interface NormalModule {
    wxs: boolean
  }
}
