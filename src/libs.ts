import { OrmModel, OrmQuery } from 'functional-models-orm'
import { FunctionalModel, Model } from 'functional-models/interfaces.js'
import { asyncMap } from 'modern-async'
import kebabCase from 'lodash/kebabCase.js'
import merge from 'lodash/merge.js'
import isString from 'lodash/isString.js'
import { SearchResult, SimpleCrudsService } from './types.js'

const getSystemInfrastructureName = ({
  environment,
  systemName,
  component,
}: {
  component?: string
  environment: string
  systemName: string
}) => {
  return component
    ? kebabCase(`${systemName}-${component}-${environment}`)
    : kebabCase(`${systemName}-${environment}`)
}

const defaultGetTableNameForModel = (
  environment: string,
  systemName: string,
  model: Model<any> | string
) => {
  const component = isString(model) ? model : model.getName()
  return getSystemInfrastructureName({ systemName, environment, component })
}

const getMongoCollectionNameForModel = () => (model: any | string) => {
  if (isString(model)) {
    return kebabCase(model)
  }
  return kebabCase(model.getName())
}

const simpleCrudsService = <T extends FunctionalModel>(
  model: OrmModel<T>
): SimpleCrudsService<T> => {
  const update = (data: T): Promise<T> => {
    return model
      .create(data)
      .save()
      .then(instance => {
        if (!instance) {
          throw new Error(`Impossible situation`)
        }
        return instance.toObj() as unknown as T
      })
  }

  const create = update

  const del = async (id: string | number): Promise<void> => {
    const instance = await model.retrieve(id)
    if (!instance) {
      return undefined
    }
    await instance.delete()
    return undefined
  }

  const retrieve = (id: string | number): Promise<T | undefined> => {
    return model.retrieve(id).then(instance => {
      if (!instance) {
        return undefined
      }
      return instance.toObj() as unknown as T
    })
  }

  const search = (ormQuery: OrmQuery): Promise<SearchResult<T>> => {
    return model.search(ormQuery).then(async result => {
      const instances = (await asyncMap(result.instances, i =>
        i.toObj()
      )) as unknown as readonly T[]
      return {
        instances,
        page: result.page,
      }
    })
  }

  return {
    create,
    update,
    delete: del,
    retrieve,
    search,
  }
}

const createSimpleServiceModelWrappers = (
  models: OrmModel<any>[]
): Record<string, SimpleCrudsService<any>> => {
  return merge(
    models.map(m => {
      return {
        [m.getName()]: simpleCrudsService(m),
      }
    })
  )
}

export {
  getMongoCollectionNameForModel,
  defaultGetTableNameForModel,
  getSystemInfrastructureName,
  simpleCrudsService,
  createSimpleServiceModelWrappers,
}
