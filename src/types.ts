import {
  FunctionalModel,
  Model,
  ModelFetcher,
} from 'functional-models/interfaces.js'
import {
  DatastoreProvider,
  OrmModel,
  OrmModelFactory,
  OrmQuery,
} from 'functional-models-orm'

enum DbNamespace {
  root = '@node-in-layers/db',
}
/**
 * Represents a set of database related objects. Both highlevel and low level.
 * These objects can be utilized deep inside a services layer, to access data.
 */
type DatabaseObjects<T extends object = object> = {
  datastoreProvider: DatastoreProvider
  cleanup: () => Promise<void>
} & T

type SimpleCrudsService<T extends FunctionalModel> = Readonly<{
  create: (data: T) => Promise<T>
  retrieve: (id: string | number) => Promise<T | undefined>
  update: (data: T) => Promise<T>
  delete: (id: string | number) => Promise<void>
  search: (ormQuery: OrmQuery) => Promise<SearchResult<T>>
}>

type NilDbServices = Readonly<{
  createMongoDatabaseObjects: (
    props: MongoDatabaseObjectsProps
  ) => Promise<DatabaseObjects<{ mongoClient: any }>>
  createOpensearchDatabaseObjects: (
    props: OpensearchDatabaseObjectsProps
  ) => DatabaseObjects<{ opensearchClient: any }>
  createSqlDatabaseObjects: (
    props: SqlDatabaseObjectsProps
  ) => DatabaseObjects<{ knexClient: any }>
  createDynamoDatabaseObjects: (
    props: DynamoDatabaseObjectsProps
  ) => DatabaseObjects<{ dynamoLibs: any; dynamoDbClient: any }>
  createMemoryDatabaseObjects: () => DatabaseObjects
  getDatabaseObjects: (
    props: DatabaseObjectsProps
  ) => Promise<DatabaseObjects> | DatabaseObjects
  getOrm: (props: { datastoreProvider: DatastoreProvider }) => {
    Model: OrmModelFactory
    fetcher: ModelFetcher
  }
  simpleCrudsService: <T extends FunctionalModel>(
    model: OrmModel<T>
  ) => SimpleCrudsService<T>
}>

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

type MongoDatabaseObjectsProps = Readonly<{
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
    | MongoDatabaseObjectsProps
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
  MongoDatabaseObjectsProps,
  DatabaseObjectsProps,
  DynamoDatabaseObjectsProps,
  BasicDatabaseProps,
  OpensearchDatabaseObjectsProps,
  SqlDatabaseObjectsProps,
  KnexConfigProps,
  SqliteConfigProps,
  SearchResult,
  DatabaseObjects,
  SimpleCrudsService,
}
