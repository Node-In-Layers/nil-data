# Data - A Node In Layers Package used for handling data and databases.

This repository focuses on accessing and manipulating data, especially the ability to easily communicate with different databases. This package provides a high level interface for working with databases via the [functional-models](https://github.com/monolithst/functional-models) framework, particularly the [functional-models-orm](https://github.com/monolithst/functional-models-orm) functional object relational mapper (ORM) framework. It also provides access to the lower level database objects, for optimized direct querying.

# How To Install

`npm i @node-in-layers/data@latest`

## Supported Databases

- dynamo
- memory
- mongo
- mysql
- opensearch
- postgres
- sqlite

## How To Add To a Node In Layers System

To use this package you must do the following:

1. Add it to the `apps` property.
1. Add a `@node-in-layers/data` section to your configuration file.

We recommend that you put the `data` app, as one of the earliest apps, it does not have any requirements, and subsequent packages likely want to use it.

#### Example inside a `config.dev.mjs` file:

```javascript
import { CoreNamespace } from '@node-in-layers/core/index.js'
import { DataNamespace } from '@node-in-layers/data/index.js'

const core = {
  systemName: 'my-system-name',
  environment: 'dev',
  apps: await Promise.all([
    import('@node-in-layers/data/index.js'), // Right here
    import('@node-in-layers/http/index.js'),
    import('./src/my-local-app/index.js'),
  ]),
  layerOrder: ['services', 'features'],
  logLevel: 'debug',
  logFormat: 'json',
}

const data = {
  databases: {
    default: {
      datastoreType: 'mysql',
    },
  },
}

export default () => ({
  [CoreNamespace.root]: core,
  [DataNamespace.root]: data,
})
```

### Multiple Database Support

This package has support for configuring multiple databases through the config file. There must be a "default" database, and any other database can be named and configured.

In the following example we configure 3 databases. 1 is the default, the 2nd is a database for "caching" and the 3rd is a database that has "legacy data" in it.

```javascript
import { CoreNamespace } from '@node-in-layers/core/index.js'
import { DataNamespace } from '@node-in-layers/data/index.js'

const core = {
  systemName: 'my-system-name',
  environment: 'dev',
  apps: await Promise.all([
    import('@node-in-layers/data/index.js'), // Right here
    import('@node-in-layers/http/index.js'),
    import('./src/my-local-app/index.js'),
  ]),
  layerOrder: ['services', 'features'],
  logLevel: 'debug',
  logFormat: 'json',
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
  [CoreNamespace.root]: core,
  [DataNamespace.root]: data,
})
```

## How To Use

There are 2 recommended uses of this package.

1. The Model Cruds Interface
1. Direct database access

### The Model Cruds Interface

The Model Cruds Interface (Create, Retrieve, Update, Delete, Search), is a series of wrappers over the top of the `functional-models-orm` framework, so that seamless integration with models can be used. Instead of having to work with the model instances directly, data can pass in and out of the database without having to know anything about how database interactions work.

This interface can quickly wrap models at the service level, feature level and above, making it very easy to create model based REST APIS.

#### A Quick Note About Designing a System Using Models

It has been our experience that data models can and should be used throughout the system, however, the "orm" part of the models, it is recommended that they only be used at the services layer. The best way to do this, is where you need "non-orm" model use (validation, meta data, etc), we recommend using the ["noop" DatastoreProvider](https://github.com/monolithst/functional-models-orm/blob/master/src/datastore/noop.ts) that is made available with the `functional-models-orm` framework.

In many other systems (such as Python's Django), when a developer uses the orm part of the modeling code (save/create/delete/etc), anywhere in the application, it can make it very difficult to optimize and understand bottlenecks of a system.

<b>Node In Layers was designed from the beginning to fix this problem, by keeping each 'kind of code' in their appropriate layers. Database accessing code should go in services.</b>

Here is how to use the Model Cruds Interface:

```typescript
import { loadSystem, Config, ServiceContext } from '@node-in-layers/core'
import { memoizeValue } from '@node-in-layers/core/libs'
import { DataNamespace, DataServicesLayer } from '@node-in-layers/data'
import { createSimpleServiceModelWrappers } from '@node-in-layers/data/libs'
import { OrmModelFactory, ormQueryBuilder } from 'functional-models-orm'
import { TextProperty, UniqueIdProperty } from 'functional-models'
import { FeaturesContext } from '@node-in-layers/core/index.js'

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
  // Add DataServices as part of the context.
  create: (context: ServiceContext<Config, DataServicesLayer>) => {
    const dataContext = context.services[DataNamespace.root]

    // A helper function so we don't have to get this more than once. We memoize it so its only executed once
    const _getModels = memoizeValue(async () => {
      // 1. Create your database instance/s
      const databases = await dataContext.getDatabases()

      // 2. Create an orm instance with your dbObjects
      const orm = dataContext.getOrm(databases.default)

      // 3. Create models
      return createMyModels(orm)
    })

    // Example: CRUDS as a service - Here is a function makes the models available as service functions.
    const getModelCruds = async () => {
      const models = await _getModels()
      // 4. Create Model Cruds Interface Wrapper.
      const wrappedMyCustomModels = dataContext.modelCrudsService(
        models.MyCustomModels
      )
      return {
        [models.MyCustomModels.getName()]: wrappedMyCustomModels,
      }

      /* An alternative approach is wrapping all of them automagically */
      return dataContext.modelCrudsServiceWrappers(models)
    }

    // Example: Using models in a service - Here is another function that uses the models to do a specific kind of search
    const mySpecialSearch = async (value: string) => {
      const models = await _getModels()
      return models.AnotherModels.search(
        ormQueryBuilder().property('name', value).take(1).compile()
      ).then(i => i.instances[0])
    }

    return {
      getModelCruds,
      mySpecialSearch,
    }
  },
}

// An Example consumer of the model cruds interface.
const myFeature = {
  create: async (context: FeaturesContext<MyConfig>) => {
    const myComplexFeature = async () => {
      const myService = context.context['myService']
      const modelServices = await myService.getModelServices()
      // Creates and saves.
      const myModel = await modelServices.MyCustomModels.create({
        id: 'my-id',
        name: 'my-custom-name',
      })

      // Get It back
      const instance = await modelServices.MyCustomModels.retrieve('my-id')

      // Use another service function that uses models.
      const value = modelServices.mySpecialSearch(instance.name)

      // Delete it.
      await modelServices.myCustomModels.delete(instance.id)
      return 'OK'
    }
    return {
      myComplexFeature,
    }
  },
}
```

### Direct Database Access

All of the objects that provide database access to `functional-models-orm` is made available in the DatabaseObjects object that comes back from `getDatabases()`. These objects (such as `knexClient`, `opensearchClient`, `mongoClient`, etc) provide the ability to do direct queries on the database using the underlying objects.

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
