# Data - A Node In Layers Package used for handling data and databases.

This repository focuses on accessing and manipulating data, especially the ability to easily communicate with different databases. This package provides the "getModelProps" interface, for `@node-in-layers/core` so that Models can be backed with an ORM.

# How To Install

`npm i @node-in-layers/data@latest`

## Supported Databases

- Mongo - [functional-models-orm-mongo](https://github.com/monolithst/functional-models-orm-mongo)
- MySql - [functional-models-orm-sql](https://github.com/monolithst/functional-models-orm-sql)
- ElasticSearch / OpenSearch - [functional-models-orm-elastic](https://github.com/monolithst/functional-models-orm-elastic)
- Postgresql - [functional-models-orm-sql](https://github.com/monolithst/functional-models-orm-sql)
- Sqlite - [functional-models-orm-sql](https://github.com/monolithst/functional-models-orm-sql)
- AWS Dynamo DB - [functional-models-orm-dynamo](https://github.com/monolithst/functional-models-orm-dynamo)
- In-Memory - [functional-models-orm-memory](https://github.com/monolithst/functional-models-orm-memory)

## How To Add To a Node In Layers System

To use this package you must do the following:

1. Add this package to the `apps` property.
1. Add `modelFactory: "@node-in-layers/data"` to the core configuration.
1. Add a `@node-in-layers/data` section to your configuration file.
1. Optional/Recommended: Add `modelCruds:true` to the core configuration.

We recommend that you put the `data` app, as one of the earliest apps, it does not have any requirements, and subsequent packages likely want to use it.

We recommend that you put the `models` layer

#### Example inside a `config.dev.mjs` file:

```javascript
import { CoreNamespace } from '@node-in-layers/core/index.js'
import { DataNamespace } from '@node-in-layers/data/index.js'

const core = {
  apps: await Promise.all([
    import('@node-in-layers/data/index.js'), // Right here
    import('@node-in-layers/http/index.js'),
    import('./src/my-local-app/index.js'),
  ]),
  layerOrder: ['services', 'features'],
  logLevel: 'debug',
  logFormat: 'json',
  // Adds the automatic CRUD wrappers to service and features.
  modelCruds: true,
  // Makes the models backed by an orm.
  modelFactory: '@node-in-layers/data',
}

const data = {
  databases: {
    default: {
      datastoreType: 'mysql',
    },
  },
}

export default () => ({
  systemName: 'my-system-name',
  environment: 'dev',
  [CoreNamespace.root]: core,
  [DataNamespace.root]: data,
})
```

### Multiple Database Support

This package has support for configuring multiple databases through the config file. There must be a "default" database, and any other database can be named and configured. For models to be backed by the correct database, "customModelFactory" must be configured to say which models are going to be backed by the non-default database.

In the following example we configure 3 databases. 1 is the default, the 2nd is a database for "caching" and the 3rd is a database that has "legacy data" in it.

```javascript
import { CoreNamespace } from '@node-in-layers/core/index.js'
import { DataNamespace } from '@node-in-layers/data/index.js'

const core = {
  apps: await Promise.all([
    import('@node-in-layers/data/index.js'), // Right here
    import('@node-in-layers/http/index.js'),
    import('./src/my-local-app/index.js'),
  ]),
  layerOrder: ['services', 'features'],
  logLevel: 'debug',
  logFormat: 'json',
  // Adds the automatic CRUD wrappers to service and features.
  modelCruds: true,
  // Makes the models backed by an orm.
  modelFactory: '@node-in-layers/data',
  customModelFactory: {
    myApp: {
      // Model named "MyModelsPluralName" is backed by the myCacheDb database
      MyModelsPluralName: ['@node-in-layers/data', 'myCacheDb'],
      // Model named "AnotherModels" is backed by the database myLegacyData
      AnotherModels: ['@node-in-layers/data', 'myLegacyData'],
    },
  },
}

const data = {
  databases: {
    default: {
      datastoreType: 'mysql',
    },
    myCacheDb: {
      datastoreType: 'dynamo',
      awsRegion: 'us-east-1',
    },
    myLegacyData: {
      datastoreType: 'sqlite',
      filename: '/data/legacy.sqlite3',
    },
  },
}

export default () => ({
  systemName: 'my-system-name',
  environment: 'dev',
  [CoreNamespace.root]: core,
  [DataNamespace.root]: data,
})
```

## How To Use

There are 2 recommended uses of this package.

1. Through the CRUDS interface provided by `@node-in-layers/core`
1. Direct database access

### Cruds Interface

Look at the `@node-in-layers/core` interface for how to access CRUDS model functions.

### Direct Database Access

All of the objects that provide database access to orm portion of `functional-models` is made available in the DatabaseObjects object that comes back from `getDatabases()`. These objects (such as `knexClient`, `opensearchClient`, `mongoClient`, etc) provide the ability to do direct queries on the database using the underlying objects.

### Important SQL Notice

The underlying libraries needed to make sql databases work are not bundled. In order to make one work (say sqlite), you must include it in your individual systems dependencies or devDependencies.

## Configurations

The following contains examples of configurations for each database:

### Dynamo Database

```typescript
{
  datastoreType: 'dynamo',
  environment: Environment,
  serviceName: PeteServiceName,
  awsRegion: string
  httpsAgentConfig?: {
    keepAlive?: boolean
    maxSockets?: number
  }
}
```

### Memory Database

```typescript
{
  datastoreType: 'memory',
}
```

### Mongo Database

```typescript
{
  datastoreType: 'mongo',
  environment: Environment,
  serviceName: PeteServiceName,
  host: string
  port?: number
  username?: string
  password?: string
}
```

### Mysql Database

```typescript
{
  datastoreType: 'mysql',
  environment: Environment,
  serviceName: PeteServiceName,
  host: string
  port?: number
  username?: string
  password?: string
}
```

### Opensearch Database

```typescript
{
  datastoreType: 'opensearch',
  environment: Environment,
  serviceName: PeteServiceName,
  username: string
  password: string
  host: string
}
```

### Postgresql Database

```typescript
{
  datastoreType: 'postgres',
  environment: Environment,
  serviceName: PeteServiceName,
  host: string
  port?: number
  username?: string
  password?: string
}
```

### Sqlite3 Database

```typescript
{
  datastoreType: 'sqlite',
  environment: Environment,
  serviceName: PeteServiceName,
  filename: string
}
```
