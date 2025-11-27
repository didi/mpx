const fs = require('fs')
const path = require('path')
const compiler = require('../../lib/script-setup-compiler/index')

jest.mock('fs')

describe('script-setup compiler external type resolution', () => {
  let mockFiles = {}

  // Mock fs.readFileSync to return content from mockFiles
  beforeEach(() => {
    mockFiles = {}
    fs.readFileSync.mockImplementation((filePath) => {
      if (mockFiles[filePath]) return mockFiles[filePath]
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`)
    })
  })

  // Helper to run the compiler with mocked context
  const runCompiler = (content, files = {}) => {
    Object.assign(mockFiles, files)

    return new Promise((resolve, reject) => {
      const context = {
        resourcePath: path.resolve('/app/src/index.mpx'),
        context: path.resolve('/app/src'),
        resource: '/app/src/index.mpx?ctorType=component&lang=ts',
        async: () => (err, result, map) => {
          if (err) reject(err)
          else resolve(result)
        },
        resolve: (ctx, req, cb) => {
          // Simple resolution logic mimicking webpack resolve
          const resolved = path.resolve(ctx, req)
          // Try exact match first, then append .ts
          if (mockFiles[resolved]) {
            cb(null, resolved)
          } else if (mockFiles[resolved + '.ts']) {
            cb(null, resolved + '.ts')
          } else {
            // If request has extension
            if (path.extname(req) && mockFiles[resolved]) {
                cb(null, resolved)
            } else {
                cb(new Error(`Module not found: ${req} in ${ctx}`))
            }
          }
        }
      }
      compiler.call(context, content, null)
    })
  }

  describe('External Type Resolution', () => {
    test('should resolve exported interface props', async () => {
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          export interface Props {
            msg: string;
            count?: number;
            isActive: boolean;
          }
        `
      }
      const content = `
        import { Props } from './types';
        defineProps<Props>();
        defineExpose({});
      `
      const result = await runCompiler(content, files)

      expect(result).toContain('properties: {')
      expect(result).toMatch(/msg:\s*{\s*type:\s*String\s*}/)
      expect(result).toMatch(/count:\s*{\s*type:\s*Number\s*}/)
      expect(result).toMatch(/isActive:\s*{\s*type:\s*Boolean\s*}/)
    })

    test('should resolve exported type alias (object literal)', async () => {
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          export type User = {
            name: string;
            age: number;
          }
        `
      }
      const content = `
        import { User } from './types';
        defineProps<User>();
        defineExpose({});
      `
      const result = await runCompiler(content, files)

      expect(result).toMatch(/name:\s*{\s*type:\s*String\s*}/)
      expect(result).toMatch(/age:\s*{\s*type:\s*Number\s*}/)
    })

    test('should handle aliased imports', async () => {
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          export interface BaseProps {
            id: string;
          }
        `
      }
      const content = `
        import { BaseProps as Props } from './types';
        defineProps<Props>();
        defineExpose({});
      `
      const result = await runCompiler(content, files)

      expect(result).toMatch(/id:\s*{\s*type:\s*String\s*}/)
    })

    test('should ignore non-exported types', async () => {
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          interface InternalProps {
            hidden: string;
          }
          export interface PublicProps {
             visible: string;
          }
        `
      }

      // Case 1: Trying to use non-exported type
      const content1 = `
        import { InternalProps } from './types';
        defineProps<InternalProps>();
        defineExpose({});
      `
      // Expectation: It should fail to find the type "InternalProps" in the external file
      await expect(runCompiler(content1, files)).rejects.toThrow(/Type "InternalProps" not found or not exported/)
    })

    test('should ignore unsupported exported types (e.g. Union)', async () => {
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          export type Status = 'a' | 'b';
        `
      }
      const content = `
        import { Status } from './types';
        defineProps<Status>();
        defineExpose({});
      `
      // The resolver only supports TSTypeLiteral or TSFunctionType for type aliases
      await expect(runCompiler(content, files)).rejects.toThrow(/Type "Status" not found or not exported/)
    })

    test('should support nested object types (flattened as Object)', async () => {
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          export interface Config {
            meta: {
              version: string;
            }
          }
        `
      }
      const content = `
        import { Config } from './types';
        defineProps<Config>();
        defineExpose({});
      `
      const result = await runCompiler(content, files)

      expect(result).toMatch(/meta:\s*{\s*type:\s*null\s*}/)
    })

    test('should prioritize local type over external type with same name', async () => {
      // Although this is an edge case (shadowing), the compiler checks current file body first
      const typesPath = path.resolve('/app/src/types.ts')
      const files = {
        [typesPath]: `
          export interface Props {
            external: boolean;
          }
        `
      }
      const content = `
        import { Props as ExternalProps } from './types';
        
        interface Props {
          local: string;
        }
        
        defineProps<Props>();
        defineExpose({});
      `
      const result = await runCompiler(content, files)

      expect(result).toMatch(/local:\s*{\s*type:\s*String\s*}/)
      expect(result).not.toContain('external')
    })
  })
})
