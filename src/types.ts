import { FunctionalModel, Model } from 'functional-models/interfaces.js'

enum DbNamespace {
  root = '@node-in-layers/db',
}

type NilDbServices = Readonly<object>

type NilDbServicesLayer = Readonly<{
  [DbNamespace.root]: NilDbServices
}>

type NilDbFeatures = Readonly<object>

type NilDbFeaturesLayer = Readonly<{
  [DbNamespace.root]: NilDbFeatures
}>

enum SupportedDatabase {
  memory = 'memory',
  dynamo = 'dynamo',
  mongo = 'mongo',
  opensearch = 'opensearch',
  mysql = 'mysql',
  postgres = 'postgres',
  sqlite = 'sqlite',
}

type BasicDatabaseProps = Readonly<{
  environment: string
  systemName: string
  getTableNameForModel?: (
    systemName: string,
    environment: string,
    model: Model<any>
  ) => string
}>

type KnexConfigProps = Readonly<{
  username?: string
  port?: number
  host?: string
  password?: string
}>

type SqliteConfigProps = Readonly<{
  filename: string
}>

type SqlDatabaseObjectsProps = Readonly<{
  datastoreType:
    | SupportedDatabase.mysql
    | SupportedDatabase.postgres
    | SupportedDatabase.sqlite
}> &
  BasicDatabaseProps &
  (KnexConfigProps | SqliteConfigProps)

type MongoDatabaseObjects = Readonly<{
  host: string
  port?: number
  username?: string
  password?: string
}> &
  BasicDatabaseProps

type OpensearchDatabaseObjectsProps = Readonly<{
  username: string
  password: string
  host: string
}> &
  BasicDatabaseProps

type DynamoDatabaseObjectsProps = Readonly<{
  awsRegion: string
  httpsAgentConfig?: {
    keepAlive?: boolean
    maxSockets?: number
  }
}> &
  BasicDatabaseProps

type DatabaseObjectsProps = Readonly<{
  datastoreType: SupportedDatabase
}> &
  BasicDatabaseProps &
  (
    | DynamoDatabaseObjectsProps
    | OpensearchDatabaseObjectsProps
    | MongoDatabaseObjects
    | SqlDatabaseObjectsProps
  )

type SearchResult<T extends FunctionalModel> = Readonly<{
  instances: readonly T[]
  page?: any
}>

export {
  NilDbServices,
  NilDbServicesLayer,
  NilDbFeatures,
  NilDbFeaturesLayer,
  DbNamespace,
  SupportedDatabase,
  MongoDatabaseObjects,
  DatabaseObjectsProps,
  DynamoDatabaseObjectsProps,
  BasicDatabaseProps,
  OpensearchDatabaseObjectsProps,
  SqlDatabaseObjectsProps,
  KnexConfigProps,
  SqliteConfigProps,
  SearchResult,
}
