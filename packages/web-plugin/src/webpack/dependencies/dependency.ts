import { dependencies } from 'webpack'

export type ModuleSerializeContext = Parameters<
  dependencies.ModuleDependency['serialize']
>[0]

export type ModuleDeserializeContext = Parameters<
  dependencies.ModuleDependency['deserialize']
>[0]

export type ModuleHash = Parameters<
  dependencies.ModuleDependency['updateHash']
>[0]
export type ModuleUpdateHashContext = Parameters<
  dependencies.ModuleDependency['updateHash']
>[1]

export type NullSerializeContext = Parameters<
  dependencies.NullDependency['serialize']
>[0]

export type NullDeserializeContext = Parameters<
  dependencies.NullDependency['deserialize']
>[0]

export type NullHash = Parameters<dependencies.NullDependency['updateHash']>[0]
export type NullUpdateHashContext = Parameters<
  dependencies.NullDependency['updateHash']
>[1]
