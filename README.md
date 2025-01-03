# nil-db - A Node In Layers Package used for handling databases.

This repository gives the ability to easily communicate with different databases. It provides a high level interface for working with databases via the [functional-models](https://github.com/monolithst/functional-models) framework, particularly the [functional-models-orm](https://github.com/monolithst/functional-models-orm) database framework. It also provides access to the lower level database objects, for optimized direct querying.

## Supported Databases

- dynamo
- memory
- mongo
- mysql
- opensearch
- postgres
- sqlite

# How To Install

`npm i @node-in-layers/db@latest`

## How To Add To a Node In Layers System

This package should be included in the configuration file, as one of the most early apps. It does not depend on any other apps, so it can be added early in the apps stack.

#### Example inside a `config.dev.mjs` file:

```javascript
import { CoreNamespace } from '@node-in-layers/core/index.js'

const core = {
  apps: await Promise.all([
    import('@node-in-layers/db/index.js'), // Right here
    import('@node-in-layers/http/index.js'),
    import('./src/my-local-app/index.js'),
  ]),
  layerOrder: ['services', 'features'],
  logLevel: 'debug',
  logFormat: 'json',
}

export default () => ({
  [CoreNamespace.root]: core,
})
```

## How To Use

There are 2 recommended uses of this package.

1. The Simple Cruds Service
1. Direct database access

### The Simple Cruds Service

The Simple Cruds Service (Create, Retrieve, Update, Delete, Search), is a wrapper over the top of the `functional-models-orm` framework, so that seamless integration with models can be used. Instead of having to work with the model instances directly, data can pass in and out of the database without having to know anything about how database interactions work.

Here is how to use the Simple Cruds Service

```typescript
import { loadSystem, Config, ServiceContext } from '@node-in-layers/core'
import { DbNamespace, NilDbServicesLayer } from '@node-in-layers/db'
import { createSimpleServiceModelWrappers } from '@node-in-layers/db/libs'
import { OrmModelFactory } from 'functional-models-orm'
import { TextProperty, UniqueIdProperty } from 'functional-models'
import { FeaturesContext } from '@node-in-layers/core/index.js'

const MY_SYSTEM_NAME = 'amazing-system'

/* A Custom configuration file that has database configurations in it */
type MyConfig = Config &
  Readonly<{
    myApp: {
      database: {
        datastoreType: 'sqlite'
        filename: './my-db.sqlite'
      }
    }
  }>

type MyCustomModel = Readonly<{
  id: string
  name: string
}>

type AnotherModel = Readonly<{
  id: string
  name: string
}>

const createMyModels = ({ Model }: { Model: OrmModelFactory }) => {
  const MyCustomModels = Model<MyCustomModel>('MyCustomModels', {
    properties: {
      id: UniqueIdProperty({ required: true }),
      name: TextProperty({ required: true }),
    },
  })
  const AnotherModels = Model<AnotherModel>('AnotherModels', {
    properties: {
      id: UniqueIdProperty({ required: true }),
      name: TextProperty({ required: true }),
    },
  })
  return {
    MyCustomModels,
    AnotherModels,
  }
}

// Using this in a service.
const myService = {
  // Add NilDbServices as part of the context.
  create: async (context: ServiceContext<MyConfig, NilDbServicesLayer>) => {
    const databaseConfig = {
      ...context.config.myApp.database,
      environment: context.environment,
      systemName: MY_SYSTEM_NAME,
    }
    // 1. Create your database instance
    const dbObjects =
      context.services[DbNamespace.root].getDatabaseObjects(databaseConfig)

    // 2. Create an orm instance with your dbObjects
    const orm = context.services[DbNamespace.root].getOrm(dbObjects)

    // 3. Create models
    const models = createMyModels(orm)

    // 4. Create Simple Cruds Service Wrapper.
    const wrappedMyCustomModels = context.services[
      DbNamespace.root
    ].simpleCrudsService(models.MyCustomModels)

    // 5. You can provide this wrapper to other services and features.
    return {
      [models.MyCustomModels.getName()]: wrappedMyCustomModels,
    }

    /* 
    An alternative approach for making many models available is to call this helpful function
    */
    const allModelsWrapped = createSimpleServiceModelWrappers(models)
    return {
      ...allModelsWrapped,
      /*
      Gives:
      MyCustomModels: simpleCrudsService,
      AnotherModels: simpleCrudsService
      */
    }
  },
}

// An Example consumer of the simple cruds service.
const myFeature = {
  create: async (context: FeaturesContext<MyConfig>) => {
    const myComplexFeature = async () => {
      const myService = context.context['myService']
      // Creates and saves.
      await myService.MyCustomModels.create({
        id: 'my-id',
        name: 'my-custom-name',
      })

      // Get It back
      const instance = await myService.MyCustomModels.retrieve('my-id')

      // Do something with the data.
      const id = instance.id
      const name = instance.name

      // Delete it.
      await myService.myCustomModels.delete(id)
      return 'OK'
    }
    return {
      myComplexFeature,
    }
  },
}
```

### Direct Database Access

All of the objects that provide database access to `functional-models-orm` is made available in the DatabaseObjects object that comes back from `getDatabaseObjects()`. These objects (such as `knexClient`, `opensearchClient`, `mongoClient`, etc) provide the ability to do direct queries on the database using the underlying objects.

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
