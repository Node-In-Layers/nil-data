import https from 'node:https'
import { memoizeValueSync } from '@node-in-layers/core/utils.js'
import { ServicesContext } from '@node-in-layers/core/index.js'
import {
  DatastoreAdapter,
  createOrm,
  ModelInstanceFetcher,
} from 'functional-models'
import { asyncMap } from 'modern-async'
import merge from 'lodash/merge.js'
import get from 'lodash/get.js'
import * as dynamo from '@aws-sdk/client-dynamodb'
import * as libDynamo from '@aws-sdk/lib-dynamodb'
import { Client as OpenSearchClient } from '@opensearch-project/opensearch'
import { MongoClient } from 'mongodb'
import knex from 'knex'
import curry from 'lodash/curry.js'
import omit from 'lodash/omit.js'
import { datastoreAdapter as dynamoDatastoreAdapter } from 'functional-models-orm-dynamo'
import { datastoreAdapter as opensearchDatastoreAdapter } from 'functional-models-orm-elastic'
import { datastoreAdapter as mongoDatastoreAdapter } from 'functional-models-orm-mongo'
import { datastoreAdapter as sqlDatastoreAdapter } from 'functional-models-orm-sql'
import { datastoreAdapter as memoryDatastoreAdapter } from 'functional-models-orm-memory'
import {
  DatabaseObjectsProps,
  DynamoDatabaseObjectsProps,
  MongoDatabaseObjectsProps,
  OpensearchDatabaseObjectsProps,
  SqlDatabaseObjectsProps,
  SupportedDatabase,
  DatabaseObjects,
  DataConfig,
  DataNamespace,
  NonProvidedDatabaseProps,
  DataServices,
  MultiDatabasesProps,
} from './types.js'
import {
  getSystemInfrastructureName,
  defaultGetTableNameForModel,
  getMongoCollectionNameForModel,
} from './libs.js'

const DEFAULT_MONGO_PORT = 27017

const createMongoConnectionString = ({
  host,
  port,
  username,
  password,
  database,
}: {
  host: string
  port?: number | string
  password?: string
  username?: string
  database?: string
}) => {
  return `mongodb://${username ? `${username}:${password}@` : ''}${host}:${
    port || DEFAULT_MONGO_PORT
  }${database ? `/${database}` : ''}`
}

const createMongoDatabaseObjects = ({
  environment,
  systemName,
  host,
  port,
  username,
  password,
  getTableNameForModel,
  additionalArgs,
  connectionString,
}: MongoDatabaseObjectsProps): DatabaseObjects<{ mongoClient: any }> => {
  const database = getSystemInfrastructureName({
    environment,
    systemName,
  })
  connectionString =
    connectionString ||
    createMongoConnectionString({
      host,
      port,
      username,
      password,
      database,
    })
  // @ts-ignore
  const mongoClient = new MongoClient(
    connectionString,
    ...(additionalArgs ? additionalArgs : [])
  )
  mongoClient.connect()

  const datastoreAdapter = mongoDatastoreAdapter.create({
    mongoClient,
    databaseName: database,
    getCollectionNameForModel: curry(
      getTableNameForModel || getMongoCollectionNameForModel
    )(environment, systemName),
  })
  const cleanup = async () => {
    return Promise.resolve()
      .then(async () => {
        await mongoClient.close()
      })
      .catch(error => {
        const errorName = (error as any)?.name
        const errorMessage = (error as any)?.message || String(error)
        const isMongoClientClosedError =
          errorName === 'MongoClientClosedError' &&
          errorMessage.includes(
            'Operation interrupted because client was closed'
          )
        const isCombinedMessageMatch = errorMessage.includes(
          'MongoClientClosedError: Operation interrupted because client was closed'
        )
        if (isMongoClientClosedError || isCombinedMessageMatch) {
          return
        }
        throw error
      })
  }
  return {
    mongoClient,
    datastoreAdapter,
    cleanup,
  }
}

const createMemoryDatabaseObjects = (): DatabaseObjects => {
  const datastoreAdapter = memoryDatastoreAdapter.create()
  return {
    cleanup: () => Promise.resolve(),
    datastoreAdapter,
  }
}

const createOpensearchDatabaseObjects = ({
  environment,
  systemName,
  username,
  password,
  host,
  getTableNameForModel,
}: OpensearchDatabaseObjectsProps): DatabaseObjects<{
  opensearchClient: any
}> => {
  const node = `https://${username}:${password}@${host}`
  const client = new OpenSearchClient({
    node,
  })
  return {
    cleanup: () => Promise.resolve(),
    opensearchClient: client,
    datastoreAdapter: opensearchDatastoreAdapter.create({
      client,
      getIndexForModel: curry(
        getTableNameForModel || defaultGetTableNameForModel
      )(environment, systemName),
    }),
  }
}

const createSqlDatabaseObjects = (
  props: SqlDatabaseObjectsProps
): DatabaseObjects<{ knexClient: any }> => {
  const needsDatabase = props.datastoreType !== 'sqlite'
  const knexConfig = {
    client: props.datastoreType,
    ...(needsDatabase
      ? {
          database: getSystemInfrastructureName({
            environment: props.environment,
            systemName: props.systemName,
          }),
        }
      : {}),
    connection: {
      ...omit(props, [
        'datastoreType',
        'environment',
        'systemName',
        'database',
      ]),
    },
  }
  // @ts-ignore
  const knexClient = knex(knexConfig)
  const datastoreAdapter = sqlDatastoreAdapter.create({
    knex: knexClient,
    getTableNameForModel: curry(
      props.getTableNameForModel || defaultGetTableNameForModel
    )(props.environment, props.systemName),
    //propertyTypeToParser: sqlParsers.BasicPropertyTypeToParser
  })

  return {
    knexClient,
    cleanup: () => Promise.resolve(),
    datastoreAdapter,
  }
}

const createDynamoDatabaseObjects = ({
  awsRegion,
  environment,
  systemName,
  httpsAgentConfig,
  getTableNameForModel,
}: DynamoDatabaseObjectsProps): DatabaseObjects<{
  dynamoLibs: any
  dynamoDbClient: any
}> => {
  const sslAgent = new https.Agent(
    httpsAgentConfig || {
      keepAlive: true,
      maxSockets: 50,
    }
  )

  const awsConfig = {
    region: awsRegion,
    sslAgent,
  }

  const dynamoDbClient = new dynamo.DynamoDBClient(awsConfig)
  const aws3 = {
    ...dynamo,
    ...libDynamo,
  }

  const datastoreAdapter = dynamoDatastoreAdapter.create({
    aws3: {
      ...aws3,
      dynamoDbClient,
    },
    getTableNameForModel: curry(
      getTableNameForModel || defaultGetTableNameForModel
    )(environment, systemName),
  })
  return {
    dynamoLibs: aws3,
    dynamoDbClient,
    datastoreAdapter,
    cleanup: () => Promise.resolve(),
  }
}

const _supportedToDatastoreAdapterFunc: Record<
  SupportedDatabase,
  DatabaseObjects<any>
> = {
  [SupportedDatabase.memory]: createMemoryDatabaseObjects,
  [SupportedDatabase.dynamo]: createDynamoDatabaseObjects,
  [SupportedDatabase.mongo]: createMongoDatabaseObjects,
  [SupportedDatabase.opensearch]: createOpensearchDatabaseObjects,
  [SupportedDatabase.sqlite]: createSqlDatabaseObjects,
  [SupportedDatabase.mysql]: createSqlDatabaseObjects,
  [SupportedDatabase.postgres]: createSqlDatabaseObjects,
}

const create = (context: ServicesContext<DataConfig>): DataServices => {
  const databases = get(context, 'config.@node-in-layers/data.databases') as
    | MultiDatabasesProps
    | undefined
  if (!databases) {
    throw new Error(
      `Must include "${DataNamespace.root}.databases" inside of a config that uses the "${DataNamespace.root}" namespace`
    )
  }

  const getDatabaseObjects = (props: DatabaseObjectsProps): DatabaseObjects => {
    const func = _supportedToDatastoreAdapterFunc[props.datastoreType]
    if (!func) {
      throw new Error(`Unhandled type ${props.datastoreType}`)
    }
    return func(props)
  }

  const getOrm = (props: { datastoreAdapter: DatastoreAdapter }) => {
    const { Model, fetcher } = createOrm(props)
    return {
      Model,
      fetcher,
    }
  }

  const cleanup = async () => {
    const databases: Record<string, DatabaseObjects> = getDatabases()
    await asyncMap(
      Object.values(databases),
      (d: DatabaseObjects) => d.cleanup(),
      1
    )
  }

  const _getDatabases = (): {
    default: DatabaseObjects
  } & Record<string, DatabaseObjects> => {
    const neededProps = {
      environment: context.config.environment,
      systemName: context.config.systemName,
    }
    const defaultDbProps = merge(
      databases.default,
      neededProps
    ) as DatabaseObjectsProps
    const otherProps: Record<string, NonProvidedDatabaseProps> =
      omit(databases, 'default') || {}
    const otherProps2: Record<string, DatabaseObjectsProps> = Object.entries(
      otherProps
    ).reduce((acc, [x, y]) => {
      return merge(acc, { [x]: merge(y, neededProps) })
    }, {}) as Record<string, DatabaseObjectsProps>

    const defaultDb = getDatabaseObjects(defaultDbProps)
    const otherDatabases: Record<string, DatabaseObjects> = Object.entries(
      otherProps2
    ).reduce(
      (acc, props) => {
        const dbObjects = getDatabaseObjects(props[1])
        return merge(acc, {
          [props[0]]: dbObjects,
        })
      },
      {} as Record<string, DatabaseObjects>
    )
    return {
      default: defaultDb,
      ...otherDatabases,
    }
  }

  const getDatabases = memoizeValueSync(_getDatabases)

  const getModelProps = <
    TModelOverrides extends object = object,
    TModelInstanceOverrides extends object = object,
  >(
    context: ServicesContext,
    datastoreName?: string
  ) => {
    datastoreName = datastoreName || 'default'
    const database = getDatabases()[datastoreName]
    if (!database) {
      throw new Error(`No database named ${datastoreName}`)
    }
    const orm = getOrm(database)
    return {
      Model: orm.Model,
      fetcher: orm.fetcher as ModelInstanceFetcher<
        TModelOverrides,
        TModelInstanceOverrides
      >,
    }
  }

  return {
    getDatabaseObjects,
    getOrm,
    getDatabases,
    cleanup,
    getModelProps,
  }
}

export { create }
