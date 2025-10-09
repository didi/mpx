import html from 'eslint-plugin-html'
import babelEslintParser from '@babel/eslint-parser'
import node from 'eslint-plugin-node'
import es from 'eslint-plugin-es'
import jsx from 'eslint-plugin-jsx'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  // {
  //   ignores: [
  //     'node_modules',
  //     'examples/mpx-progressive',
  //     'build',
  //     'packages/size-report/public',
  //     '**/dist/**'
  //   ],
  //   linterOptions: {
  //     reportUnusedDisableDirectives: false,
  //   },
  //   languageOptions: {
  //     sourceType: 'module',
  //     globals: {
  //       mpxGlobal: 'readonly',
  //       wx: 'readonly',
  //       my: 'readonly',
  //       swan: 'readonly',
  //       qq: 'readonly',
  //       tt: 'readonly',
  //       jd: 'readonly',
  //       qa: 'readonly',
  //       dd: 'readonly',
  //       Component: 'readonly',
  //       Page: 'readonly',
  //       App: 'readonly',
  //       Mixin: 'readonly',
  //       __mpx_mode__: 'readonly',
  //       __mpx_env__: 'readonly',
  //       __mpx_dynamic_runtime__: 'readonly',
  //       getRegExp: 'readonly',
  //       getCurrentPages: 'readonly'
  //     }
  //   },
  //   plugins: {
  //     html,
  //     node,
  //     es,
  //     jsx,
  //     reactHooks
  //   },
  // },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules',
      '**/dist/**',
    ],
  },
  // {
  //   files: ['**/*.{js,jsx}'],
  //   languageOptions: {
  //     parser: babelEslintParser,
  //     parserOptions: {
  //       requireConfigFile: false,
  //       babelOptions: {
  //         plugins: ['@babel/plugin-syntax-jsx']
  //       },
  //       sourceType: 'module',
  //       globals: {
  //         mpxGlobal: 'readonly',
  //         wx: 'readonly',
  //         my: 'readonly',
  //         swan: 'readonly',
  //         qq: 'readonly',
  //         tt: 'readonly',
  //         jd: 'readonly',
  //         qa: 'readonly',
  //         dd: 'readonly',
  //         Component: 'readonly',
  //         Page: 'readonly',
  //         App: 'readonly',
  //         Mixin: 'readonly',
  //         __mpx_mode__: 'readonly',
  //         __mpx_env__: 'readonly',
  //         __mpx_dynamic_runtime__: 'readonly',
  //         getRegExp: 'readonly',
  //         getCurrentPages: 'readonly'
  //       }
  //     },
  //   },
  //   linterOptions: {
  //     reportUnusedDisableDirectives: false,
  //   },
  //   plugins: {
  //     html,
  //     node,
  //     es,
  //     jsx,
  //     reactHooks
  //   },
  //   rules: {}
  // },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      html,
      node,
      es,
      jsx,
      reactHooks,
      '@typescript-eslint': tseslint
    },
  },
  // {
  //   files: ['packages/webpack-plugin/lib/runtime/components/react/**/*.{js,jsx,ts,tsx}'],
  //   ignores: [
  //     '**/dist/**'
  //   ],
  //   plugins: {
  //     'react-hooks': reactHooks,
  //     node,
  //   },
  //   rules: {
  //     'react-hooks/rules-of-hooks': 'error'
  //   }
  // }
]
