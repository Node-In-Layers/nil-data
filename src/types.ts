import {
  DataDescription,
  ModelType,
  DatastoreAdapter,
  Orm,
} from 'functional-models'
import { Config, GetModelPropsFunc } from '@node-in-layers/core/index.js'

enum DataNamespace {
  root = '@node-in-layers/data',
}

enum SupportedDatabase {
  memory = 'memory',
  json = 'json',
  dynamo = 'dynamo',
  redis = 'redis',
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
    model: ModelType<any>
  ) => string
  additionalArgs?: readonly any[]
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
  connectionString?: string
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
  awsClientProps?: Record<string, any>
  httpsAgentConfig?: {
    keepAlive?: boolean
    maxSockets?: number
  }
}> &
  BasicDatabaseProps

type JsonDatabaseObjectsProps = Readonly<{
  filePath: string
  databaseMode?: boolean
}> &
  BasicDatabaseProps

type RedisDatabaseObjectsProps = Readonly<{
  host: string
  port?: number
  username?: string
  password?: string
}>

type DatabaseObjectsProps = Readonly<{
  datastoreType: SupportedDatabase
}> &
  BasicDatabaseProps &
  (
    | DynamoDatabaseObjectsProps
    | OpensearchDatabaseObjectsProps
    | RedisDatabaseObjectsProps
    | MongoDatabaseObjectsProps
    | SqlDatabaseObjectsProps
    | JsonDatabaseObjectsProps
  )

type SearchResult<T extends DataDescription> = Readonly<{
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
   * This datastoreAdapter is used for backing the ORM system.
   */
  datastoreAdapter: DatastoreAdapter
  /**
   * A cleanup function that should run at the end of the application, that cleans up database connections.
   */
  cleanup: () => Promise<void>
} & T

/**
 * Data services.
 */
type DataServices = Readonly<{
  getDatabaseObjects: (props: DatabaseObjectsProps) => DatabaseObjects
  getOrm: (props: { datastoreAdapter: DatastoreAdapter }) => Orm
  /**
   * Gets all databases. This is memoized, so on the first attempt, it will create connections to 1 or more databases
   * and then give you access to those database objects for further use. Very useful in a services layer.
   */
  getDatabases: () => MultiDatabases
  /**
   * Runs cleanup on every database connection. Only run when the application is ending.
   */
  cleanup: () => Promise<void>
  /**
   * A function that gives ModelProps. This is useful for getting enabling ORM based models.
   */
  getModelProps: GetModelPropsFunc
}>

/**
 * The services for the Data package.
 */
type DataServicesLayer = Readonly<{
  [DataNamespace.root]: DataServices
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
  DataConfig,
  DataServicesLayer,
  MultiDatabasesProps,
  MultiDatabases,
  NonProvidedDatabaseProps,
  JsonDatabaseObjectsProps,
  RedisDatabaseObjectsProps,
}
