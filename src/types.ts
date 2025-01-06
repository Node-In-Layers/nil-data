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
import { Config } from '@node-in-layers/core/index.js'

enum DataNamespace {
  root = '@node-in-layers/data',
}

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

type NonProvidedDatabaseProps = Omit<
  DatabaseObjectsProps,
  'systemName' | 'environment'
>

type DefaultDatabaseProps = {
  default: NonProvidedDatabaseProps
}

type MultiDatabasesProps = DefaultDatabaseProps &
  Record<string, NonProvidedDatabaseProps>

/**
 * A config that uses databases.
 */
type DataConfig = Config & {
  [DataNamespace.root]: {
    databases: DefaultDatabaseProps | MultiDatabasesProps
  }
}
/**
 * Represents a set of database related objects. Both highlevel and low level.
 * These objects can be utilized deep inside a services layer, to access data.
 */
type DatabaseObjects<T extends object = object> = {
  /**
   * This datastoreProvider is used for backing the ORM system.
   */
  datastoreProvider: DatastoreProvider
  /**
   * A cleanup function that should run at the end of the application, that cleans up database connections.
   */
  cleanup: () => Promise<void>
} & T

/**
 * An interface for making CRUDS (create/retrieve/update/delete/search) commands into a database.
 */
type ModelCrudsInterface<T extends FunctionalModel> = Readonly<{
  /**
   * Create either one item, or an array of items in a database
   * @param data
   */
  create: (data: T) => Promise<T>
  /**
   * Retrieve a single item from the database.
   * @param id
   */
  retrieve: (id: string | number) => Promise<T | undefined>
  /**
   * Updates a single item in the database
   * @param data
   */
  update: (data: T) => Promise<T>
  /**
   * Deletes an item from the database
   * @param id
   */
  delete: (id: string | number) => Promise<void>
  /**
   * Searches the corresponding table for this item.
   * @param ormQuery
   */
  search: (ormQuery: OrmQuery) => Promise<SearchResult<T>>
}>

/**
 * Data services.
 */
type DataServices = Readonly<{
  getDatabaseObjects: (
    props: DatabaseObjectsProps
  ) => Promise<DatabaseObjects> | DatabaseObjects
  getOrm: (props: { datastoreProvider: DatastoreProvider }) => {
    Model: OrmModelFactory
    fetcher: ModelFetcher
  }
  /**
   * Gets all databases. This is memoized, so on the first attempt, it will create connections to 1 or more databases
   * and then give you access to those database objects for further use. Very useful in a services layer.
   */
  getDatabases: () => Promise<MultiDatabases>
  /**
   * Runs cleanup on every database connection. Only run when the application is ending.
   */
  cleanup: () => Promise<void>
  modelCrudsServices: <T extends FunctionalModel>(
    model: OrmModel<T>
  ) => ModelCrudsInterface<T>
  modelCrudsServiceWrappers: (
    models: OrmModel<any>[]
  ) => Record<string, ModelCrudsInterface<any>>
}>

/**
 * The services for the Data package.
 */
type DataServicesLayer = Readonly<{
  [DataNamespace.root]: DataServices
}>

/**
 * The Features for the Data package.
 */
type DataFeatures = Readonly<{
  wrapModelCrudsService: <T extends FunctionalModel>(
    modelCruds: ModelCrudsInterface<T>,
    overrides: Partial<ModelCrudsInterface<T>>
  ) => ModelCrudsInterface<T>
  wrapAllModelCrudsServices: (
    objs: Record<string, ModelCrudsInterface<any>>,
    overrides?: Record<string, ModelCrudsInterface<any>>
  ) => Record<string, ModelCrudsInterface<any>>
}>

/**
 * The Features Layer for the Data package.
 */
type DataFeaturesLayer = Readonly<{
  [DataNamespace.root]: DataFeatures
}>

/**
 * The default database configured.
 */
type DefaultDatabase = {
  default: DatabaseObjects
}

/**
 * 1 or more databases configured
 */
type MultiDatabases = DefaultDatabase & Record<string, DatabaseObjects>

export {
  DataServices,
  DataFeatures,
  DataFeaturesLayer,
  DataNamespace,
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
  ModelCrudsInterface,
  DataConfig,
  DataServicesLayer,
  MultiDatabasesProps,
  MultiDatabases,
  NonProvidedDatabaseProps,
}
