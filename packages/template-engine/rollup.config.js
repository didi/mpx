import typescript from 'rollup-plugin-typescript2'

const { join } = require('path')

const cwd = __dirname

const baseConfig = {
  input: join(cwd, 'src/index.ts'),
  output: [
    {
      file: join(cwd, 'dist/index.js'),
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          preserveConstEnums: true
        }
      }
    })
  ]
}

module.exports = [baseConfig]
