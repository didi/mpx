const viewer = require('./viewer')
const path = require('path')
const matchCondition = require('./utils/match-condition')
const parseRequest = require('./utils/parse-request')
const parseAsset = require('./utils/parse-asset')
const toPosix = require('./utils/to-posix')
const getMainCompilation = require('./utils/get-main-compilation')

class SizeReportPlugin {
  constructor (opts = {}) {
    this.options = Object.assign(
      {
        reportMode: 'server',
        reportHost: '127.0.0.1',
        startServer: true,
        readFilePath: '',
        autoOpenBrowser: true,
        serverPort: 'serverPort' in opts ? (opts.serverPort === 'auto' ? 0 : opts.serverPort) : 9999,
        reportSize: {
          groups: []
        }
      },
      opts
    )

    this.server = null
  }

  apply (compiler) {
    function every (set, fn) {
      for (const item of set) {
        if (!fn(item)) return false
      }
      return true
    }

    function has (set, fn) {
      for (const item of set) {
        if (fn(item)) return true
      }
      return false
    }

    function map (set, fn) {
      const result = new Set()
      set.forEach((item) => {
        result.add(fn(item))
      })
      return result
    }

    function filter (set, fn) {
      const result = new Set()
      set.forEach((item) => {
        if (fn(item)) {
          result.add(item)
        }
      })
      return result
    }

    function concat (setA, setB) {
      const result = new Set()
      setA.forEach((item) => {
        result.add(item)
      })
      setB.forEach((item) => {
        result.add(item)
      })
      return result
    }

    function mapToArr (set, fn) {
      const result = []
      set.forEach((item) => {
        result.push(fn(item))
      })
      return result
    }

    function walkEntry (entryModule, sideEffect) {
      const modulesSet = new Set()

      function walkDependencies (dependencies = []) {
        dependencies.forEach((dep) => {
          // // We skip Dependencies without Reference
          // const ref = compilation.getDependencyReference(module, dep)
          // if (!ref) {
          //   return
          // }
          // // We skip Dependencies without Module pointer
          // const refModule = ref.module
          // if (!refModule) {
          //   return
          // }
          // // We skip weak Dependencies
          // if (ref.weak) {
          //   return
          // }
          const refModule = dep.module || dep.removedModule || dep.childCompileEntryModule
          if (refModule) walk(refModule)
        })
      }

      function walk (module) {
        if (modulesSet.has(module)) return
        sideEffect && sideEffect(module, entryModule)
        modulesSet.add(module)
        walkDependencies(module.dependencies)
        module.blocks.forEach((block) => {
          walkDependencies(block.dependencies)
        })
        module.variables.forEach((variable) => {
          walkDependencies(variable.dependencies)
        })
      }

      walk(entryModule)
    }

    function walkPageEntry (entryPageNode, sideEffect) {
      // mpx.getEntryNode(entryModule.request, 'Page')
      const modulesSet = new Set()

      function walkDependencies (dependencies = []) {
        dependencies.forEach((dep) => {
          // // We skip Dependencies without Reference
          // const ref = compilation.getDependencyReference(module, dep)
          // if (!ref) {
          //   return
          // }
          // // We skip Dependencies without Module pointer
          // const refModule = ref.module
          // if (!refModule) {
          //   return
          // }
          // // We skip weak Dependencies
          // if (ref.weak) {
          //   return
          // }
          const refModule = dep.module || dep.removedModule || dep.childCompileEntryModule
          if (refModule) walk(refModule)
        })
      }

      function walkChildren (children) {
        children.forEach((child) => {
          walk(child)
        })
      }

      function walk (module) {
        if (modulesSet.has(module)) return
        sideEffect && sideEffect(module, entryPageNode)
        if (module.module) {
          sideEffect && sideEffect(module.module, entryPageNode)
        }
        modulesSet.add(module)
        const depModule = module.module || module
        if (module.children && module.children.size) {
          walkChildren(module.children)
        }
        walkDependencies(depModule.dependencies)
        depModule.blocks.forEach((block) => {
          walkDependencies(block.dependencies)
        })
        depModule.variables.forEach((variable) => {
          walkDependencies(variable.dependencies)
        })
      }

      walk(entryPageNode)
    }

    const done = async (stats, callback) => {
      const compilation = stats.compilation
      const mpx = compilation.__mpx__
      const reportGroups = this.options.reportSize.groups || []
      const mainCompilation = getMainCompilation(compilation)
      const rootName = mainCompilation._preparedEntrypoints[0].name

      const pagesSizeInfo = {
        pages: []
      }

      const reportGroupsWithNoEntryRules = reportGroups.filter((reportGroup) => {
        return reportGroup.hasOwnProperty('noEntryRules')
      })

      // Walk and mark entryModules/noEntryModules
      compilation.chunks.forEach((chunk) => {
        if (chunk.entryModule) {
          walkEntry(chunk.entryModule, (module, entryModule) => {
            module.entryModules = module.entryModules || new Set()
            module.entryModules.add(entryModule)
          })
          // Walk and mark page entryModules/noEntryModules
          if (Object.values(mpx.pagesMap).includes(chunk.name) || rootName === chunk.name) {
            const type = rootName === chunk.name ? 'App' : 'Page'
            const entryPageNode = mpx.getEntryNode(chunk.entryModule.rawRequest, type)
            if (type === 'App') {
              const copyChildren = new Set()
              entryPageNode.children.forEach((child) => {
                if (child.type !== 'Page') {
                  copyChildren.add(child)
                }
              })
              entryPageNode.children = copyChildren
            }
            pagesSizeInfo.pages.push({
              name: chunk.name,
              request: entryPageNode.request,
              size: 0,
              selfSize: 0,
              sharedSize: 0,
              selfModules: [],
              sharedModules: []
            })
            walkPageEntry(entryPageNode, (module, entryPageNode) => {
              module.entryPageNodes = module.entryPageNodes || new Set()
              module.entryPageNodes.add(entryPageNode)
            })
          }

          reportGroups.forEach((reportGroup) => {
            reportGroup.entryModules = reportGroup.entryModules || new Set()
            if (reportGroup.entryRules && matchCondition(parseRequest(chunk.entryModule.resource).resourcePath, reportGroup.entryRules)) {
              reportGroup.entryModules.add(chunk.entryModule)
            }
          })
        }
      })

      // TODO
      if (reportGroupsWithNoEntryRules.length) {
        compilation.modules.forEach((module) => {
          reportGroupsWithNoEntryRules.forEach((reportGroup) => {
            if ((module.resource && matchCondition(parseRequest(module.resource).resourcePath, reportGroup.noEntryRules)) || (module.modules && has(module.modules, (module) => {
              return module.resource && matchCondition(parseRequest(module.resource).resourcePath, reportGroup.noEntryRules)
            }))) {
              reportGroup.noEntryModules = reportGroup.noEntryModules || new Set()
              reportGroup.noEntryModules.add(module)
              walkEntry(module, (module, noEntryModule) => {
                module.noEntryModules = module.noEntryModules || new Set()
                module.noEntryModules.add(noEntryModule)
              })
            }
          })
        })
      }

      const subpackages = Object.keys(mpx.componentsMap)
      delete subpackages.main

      function getPackageName (fileName) {
        fileName = toPosix(fileName)
        for (let packageName of subpackages) {
          if (fileName.startsWith(packageName + '/')) return packageName
        }
        return 'main'
      }

      function getEntrySet (entryModules, ignoreSubEntry) {
        const selfSet = new Set()
        const sharedSet = new Set()
        const otherSelfEntryModules = new Set()
        entryModules.forEach((entryModule) => {
          const entryNode = mpx.entryModulesMap.get(entryModule)
          if (entryNode) {
            selfSet.add(entryNode)
          } else {
            // 没有在entryModulesMap记录的entryModule默认为selfEntryModule
            otherSelfEntryModules.add(entryModule)
          }
        })
        if (!ignoreSubEntry) {
          let currentSet = selfSet
          while (currentSet.size) {
            const newSet = new Set()
            currentSet.forEach((entryNode) => {
              entryNode.children.forEach((childNode) => {
                if (selfSet.has(childNode) || sharedSet.has(childNode)) return
                if (every(childNode.parents, (parentNode) => {
                  return selfSet.has(parentNode)
                })) {
                  selfSet.add(childNode)
                } else {
                  sharedSet.add(childNode)
                }
                newSet.add(childNode)
              })
            })
            currentSet = newSet
          }
        }

        return {
          selfEntryModules: concat(map(filter(selfSet, item => {
            if (!item.module) {
              compilation.warnings.push(`EntryNode[${item.request}] has no module, please check!`)
              return false
            }
            return true
          }), item => item.module), otherSelfEntryModules),
          sharedEntryModules: map(filter(sharedSet, item => {
            if (!item.module) {
              compilation.warnings.push(`EntryNode[${item.request}] has no module, please check!`)
              return false
            }
            return true
          }), item => item.module)
        }
      }

      // Get and split selfEntryModules & sharedEntryModules
      reportGroups.forEach((reportGroup) => {
        const entrySet = getEntrySet(reportGroup.entryModules, reportGroup.ignoreSubEntry)
        Object.assign(reportGroup, entrySet, {
          selfSize: 0,
          selfSizeInfo: {},
          sharedSize: 0,
          sharedSizeInfo: {}
        })
      })

      function fillSizeInfo (sizeInfo, packageName, fillType, fillInfo) {
        sizeInfo[packageName] = sizeInfo[packageName] || {
          assets: [],
          modules: [],
          size: 0
        }
        sizeInfo[packageName][fillType].push({ ...fillInfo })
        sizeInfo[packageName].size += fillInfo.size
      }

      function fillSizeReportGroups (entryModules, noEntryModules, packageName, fillType, fillInfo) {
        reportGroups.forEach((reportGroup) => {
          if (reportGroup.noEntryModules && noEntryModules && noEntryModules.size) {
            if (has(noEntryModules, (noEntryModule) => {
              return reportGroup.noEntryModules.has(noEntryModule) && every(entryModules, (entryModule) => {
                return noEntryModule.entryModules.has(entryModule)
              })
            })) {
              reportGroup.selfSize += fillInfo.size
              return fillSizeInfo(reportGroup.selfSizeInfo, packageName, fillType, fillInfo)
            } else if (has(noEntryModules, (noEntryModule) => {
              return reportGroup.noEntryModules.has(noEntryModule)
            })) {
              reportGroup.sharedSize += fillInfo.size
              return fillSizeInfo(reportGroup.sharedSizeInfo, packageName, fillType, fillInfo)
            }
          }
          if (entryModules && entryModules.size) {
            if (every(entryModules, (entryModule) => {
              return reportGroup.selfEntryModules.has(entryModule)
            })) {
              reportGroup.selfSize += fillInfo.size
              return fillSizeInfo(reportGroup.selfSizeInfo, packageName, fillType, fillInfo)
            } else if (has(entryModules, (entryModule) => {
              return reportGroup.selfEntryModules.has(entryModule) || reportGroup.sharedEntryModules.has(entryModule)
            })) {
              reportGroup.sharedSize += fillInfo.size
              return fillSizeInfo(reportGroup.sharedSizeInfo, packageName, fillType, fillInfo)
            }
          }
        })
      }
      function fillSizeReportPages (entryPageNodes, fillInfo) {
        pagesSizeInfo.pages.forEach((page) => {
          if (entryPageNodes && entryPageNodes.size) {
            const nodesLen = entryPageNodes.size
            // currentModule is some Page Module
            if (has(entryPageNodes, (entryPageNode) => {
              return entryPageNode.request === page.request
            })) {
              const size = fillInfo.size / nodesLen
              page.size += size
              if (nodesLen > 1) {
                page.sharedSize += size
                // page.sharedModules.push({...fillInfo})
              } else {
                page.selfSize += size
                // page.selfModules.push({...fillInfo})
              }
            }
          }
        })
      }

      const assetsSizeInfo = {
        assets: []
      }

      const packagesSizeInfo = {}

      const sizeSummary = {
        groups: [],
        sizeInfo: packagesSizeInfo,
        totalSize: 0,
        staticSize: 0,
        chunkSize: 0,
        copySize: 0
      }

      function fillPackagesSizeInfo (packageName, size) {
        packagesSizeInfo[packageName] = packagesSizeInfo[packageName] || 0
        packagesSizeInfo[packageName] += size
      }

      const modulesMapById = compilation.modules.reduce((map, module) => {
        map[module.id] = module
        return map
      }, {})

      // Generate original size info
      for (let name in compilation.assets) {
        const packageName = getPackageName(name)
        const assetInfo = compilation.assetsInfo.get(name)
        if (assetInfo && assetInfo.modules) {
          const entryModules = new Set()
          const entryPageNodes = new Set()
          const noEntryModules = new Set()
          // 循环 modules，存储到 entryModules 和 noEntryModules 中
          assetInfo.modules.forEach((module) => {
            if (module.entryModules) {
              module.entryModules.forEach((entryModule) => {
                entryModules.add(entryModule)
              })
            }
            if (module.entryPageNodes) {
              module.entryPageNodes.forEach((entryPageNode) => {
                entryPageNodes.add(entryPageNode)
              })
            }
            if (module.noEntryModules) {
              module.noEntryModules.forEach((noEntryModule) => {
                noEntryModules.add(noEntryModule)
              })
            }
          })
          const size = compilation.assets[name].size()
          const identifierSet = new Set()
          let identifier = ''
          assetInfo.modules.forEach((module) => {
            const moduleIdentifier = module.readableIdentifier(compilation.requestShortener)
            identifierSet.add(moduleIdentifier)
            if (!identifier) identifier = moduleIdentifier
          })
          if (identifierSet.size > 1) identifier += ` + ${identifierSet.size - 1} modules`

          fillSizeReportGroups(entryModules, noEntryModules, packageName, 'assets', {
            name,
            identifier,
            size
          })
          fillSizeReportPages(entryPageNodes, {
            name,
            identifier,
            size
          })
          assetsSizeInfo.assets.push({
            type: 'static',
            name,
            packageName,
            size,
            modules: mapToArr(identifierSet, (identifier) => {
              return {
                identifier
              }
            })
          })
          fillPackagesSizeInfo(packageName, size)
          sizeSummary.staticSize += size
          sizeSummary.totalSize += size
        } else if (/\.m?js$/i.test(name)) {
          let parsedModules
          try {
            parsedModules = parseAsset(compilation.assets[name].source())
          } catch (err) {
            const msg = err.code === 'ENOENT' ? 'no such file' : err.message
            compilation.errors.push(`Error parsing bundle asset "${name}": ${msg}`)
            continue
          }
          let size = compilation.assets[name].size()
          const chunkAssetInfo = {
            type: 'chunk',
            name,
            packageName,
            size,
            modules: []
            // webpackTemplateSize: 0
          }
          assetsSizeInfo.assets.push(chunkAssetInfo)
          fillPackagesSizeInfo(packageName, size)
          sizeSummary.chunkSize += size
          sizeSummary.totalSize += size
          for (let id in parsedModules) {
            const module = modulesMapById[id]
            const moduleSize = Buffer.byteLength(parsedModules[id])
            const identifier = module.readableIdentifier(compilation.requestShortener)
            fillSizeReportGroups(module.entryModules, module.noEntryModules, packageName, 'modules', {
              name,
              identifier,
              size: moduleSize
            })
            fillSizeReportPages(module.entryPageNodes, {
              name,
              identifier,
              size: moduleSize
            })
            chunkAssetInfo.modules.push({
              identifier,
              size: moduleSize
            })
            size -= moduleSize
          }
          // chunkAssetInfo.webpackTemplateSize = size
          // filter sourcemap
        } else if (!/\.m?js\.map$/i.test(name)) {
          // static copy assets such as project.config.json
          const size = compilation.assets[name].size()
          assetsSizeInfo.assets.push({
            type: 'copy',
            name,
            packageName,
            size
          })
          fillPackagesSizeInfo(packageName, size)
          sizeSummary.copySize += size
          sizeSummary.totalSize += size
        }
      }

      // Check threshold
      function normalizeThreshold (threshold) {
        if (typeof threshold === 'number') return threshold
        if (typeof threshold === 'string') {
          if (/ki?b$/i.test(threshold)) return parseFloat(threshold) * 1024
          if (/mi?b$/i.test(threshold)) return parseFloat(threshold) * 1024 * 1024
        }
        return +threshold
      }

      function checkThreshold (threshold, size, sizeInfo, reportGroupName) {
        const sizeThreshold = normalizeThreshold(threshold.size || threshold)
        const packagesThreshold = threshold.packages
        const prefix = reportGroupName ? `${reportGroupName}体积分组` : '总包'

        if (sizeThreshold && size && size > sizeThreshold) {
          compilation.errors.push(`${prefix}的总体积（${size}B）超过设定阈值（${sizeThreshold}B），请检查！`)
        }

        if (packagesThreshold && sizeInfo) {
          for (const packageName in sizeInfo) {
            const packageSize = sizeInfo[packageName].size || sizeInfo[packageName]
            const packageSizeThreshold = normalizeThreshold(packagesThreshold[packageName] || packagesThreshold)
            if (packageSize && packageSizeThreshold && packageSize > packageSizeThreshold) {
              const readablePackageName = packageName === 'main' ? '主包' : `${packageName}分包`
              compilation.errors.push(`${prefix}的${readablePackageName}体积（${packageSize}B）超过设定阈值（${packageSizeThreshold}B），请检查！`)
            }
          }
        }
      }

      if (this.options.reportSize.threshold) {
        checkThreshold(this.options.reportSize.threshold, sizeSummary.totalSize, packagesSizeInfo)
      }

      reportGroups.forEach((reportGroup) => {
        if (reportGroup.threshold) {
          checkThreshold(reportGroup.threshold, reportGroup.selfSize, reportGroup.selfSizeInfo, reportGroup.name || 'anonymous group')
        }
      })

      // Format size info
      function mapModulesReadable (modulesSet) {
        return mapToArr(modulesSet, (module) => module.readableIdentifier(compilation.requestShortener))
      }

      function formatSizeInfo (sizeInfo) {
        const result = {}
        for (const key in sizeInfo) {
          const item = sizeInfo[key]
          result[key] = {
            assets: sortAndFormat(item.assets),
            modules: sortAndFormat(item.modules),
            size: formatSize(item.size)
          }
        }
        return result
      }

      function formatSize (byteLength) {
        if (typeof byteLength !== 'number') return byteLength
        return (byteLength / 1024).toFixed(2) + 'KiB'
      }

      function sortAndFormat (sizeItems) {
        sizeItems.sort((a, b) => {
          return b.size - a.size
        }).forEach((sizeItem) => {
          sizeItem.size = formatSize(sizeItem.size)
        })
        return sizeItems
      }

      const groupsSizeInfo = reportGroups.map((reportGroup) => {
        const readableInfo = {}
        readableInfo.name = reportGroup.name || 'anonymous group'
        readableInfo.selfEntryModules = mapModulesReadable(reportGroup.selfEntryModules)
        readableInfo.sharedEntryModules = mapModulesReadable(reportGroup.sharedEntryModules)
        if (reportGroup.noEntryModules) readableInfo.noEntryModules = mapModulesReadable(reportGroup.noEntryModules)
        readableInfo.selfSize = formatSize(reportGroup.selfSize)
        readableInfo.selfSizeInfo = formatSizeInfo(reportGroup.selfSizeInfo)
        readableInfo.sharedSize = formatSize(reportGroup.sharedSize)
        readableInfo.sharedSizeInfo = formatSizeInfo(reportGroup.sharedSizeInfo)
        return readableInfo
      })

      const realPagesSizeInfo = {
        pages: [],
        totalSize: 0
      }
      realPagesSizeInfo.pages = pagesSizeInfo.pages.map((pageSizeInfo) => {
        const readableInfo = {}
        readableInfo.name = pageSizeInfo.name
        readableInfo.request = pageSizeInfo.request
        readableInfo.size = formatSize(pageSizeInfo.size)
        readableInfo.selfSize = formatSize(pageSizeInfo.selfSize)
        readableInfo.sharedSize = formatSize(pageSizeInfo.sharedSize)
        readableInfo.selfModules = pageSizeInfo.selfModules
        readableInfo.sharedModules = pageSizeInfo.sharedModules
        realPagesSizeInfo.totalSize += pageSizeInfo.size
        return readableInfo
      })
      realPagesSizeInfo.totalSize = formatSize(realPagesSizeInfo.totalSize)

      sortAndFormat(assetsSizeInfo.assets)
      assetsSizeInfo.assets.forEach((asset) => {
        if (asset.modules) sortAndFormat(asset.modules)
      })
      // TODO 添加PageSize
      'totalSize|staticSize|chunkSize|copySize'.split('|').forEach((key) => {
        sizeSummary[key] = formatSize(sizeSummary[key])
      })
      groupsSizeInfo.forEach((groupSizeInfo) => {
        const groupSummary = {
          name: groupSizeInfo.name,
          selfSize: 0,
          selfSizeInfo: {},
          sharedSize: 0,
          sharedSizeInfo: {}
        }
        groupSummary.selfSize = groupSizeInfo.selfSize
        for (const key in groupSizeInfo.selfSizeInfo) {
          groupSummary.selfSizeInfo[key] = groupSizeInfo.selfSizeInfo[key].size
        }
        groupSummary.sharedSize = groupSizeInfo.sharedSize
        for (const key in groupSizeInfo.sharedSizeInfo) {
          groupSummary.sharedSizeInfo[key] = groupSizeInfo.sharedSizeInfo[key].size
        }
        sizeSummary.groups.push(groupSummary)
      })

      for (const packageName in packagesSizeInfo) {
        packagesSizeInfo[packageName] = formatSize(packagesSizeInfo[packageName])
      }

      const reportData = {
        sizeSummary,
        groupsSizeInfo,
        assetsSizeInfo,
        pagesSizeInfo: realPagesSizeInfo
      }

      const fields = this.options.reportSize.fields || {}

      'sizeSummary|groupsSizeInfo|assetsSizeInfo'.split('|').forEach((key) => {
        if (fields.hasOwnProperty(key) && !fields[key]) delete reportData[key]
      })
      const reportFilePath = path.resolve(compiler.outputPath, this.options.reportSize.filename || 'report.json')
      compiler.outputFileSystem.mkdirp(path.dirname(reportFilePath), (err) => {
        if (err) return callback(err)
        compiler.outputFileSystem.writeFile(reportFilePath, JSON.stringify(reportData, null, 2), async (err) => {
          const logger = compilation.getLogger('MpxWebpackPlugin')
          logger.info(`Size report is generated in ${reportFilePath}!`)
          if (this.options.startServer) {
            await this.startSizeReportServer(JSON.stringify(reportData, null, 2))
          }
          callback(err)
        })
      })
    }

    if (compiler.hooks) {
      compiler.hooks.done.tapAsync('mpx-size-report', done)
    } else {
      compiler.plugin('done', done)
    }
  }

  async startSizeReportServer (reportData) {
    this.server = viewer.startServer(reportData, {
      host: this.options.reportHost,
      port: this.options.serverPort,
      autoOpenBrowser: this.options.autoOpenBrowser,
      startServer: this.options.startServer,
      readFilePath: this.options.readFilePath
      // bundleDir: this.getBundleDirFromCompiler(),
      // logger: this.logger,
      // defaultSizes: this.options.defaultSizes,
      // excludeAssets: this.options.excludeAssets
    })
  }
}

module.exports = SizeReportPlugin
