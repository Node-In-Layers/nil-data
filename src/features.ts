import merge from 'lodash/merge.js'
import { FunctionalModel } from 'functional-models/interfaces.js'
import { Config, FeaturesContext } from '@node-in-layers/core/index.js'
import {
  DataServicesLayer,
  DataFeaturesLayer,
  DataFeatures,
  ModelCrudsInterface,
} from './types.js'

const create = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: FeaturesContext<Config, DataServicesLayer, DataFeaturesLayer>
): DataFeatures => {
  const wrapModelCrudsService = <T extends FunctionalModel>(
    modelCruds: ModelCrudsInterface<T>,
    overrides: Partial<ModelCrudsInterface<T>>
  ) => {
    return merge({}, modelCruds, overrides)
  }

  const wrapAllModelCrudsServices = (
    objs: Record<string, ModelCrudsInterface<any>>,
    overrides?: Record<string, Partial<ModelCrudsInterface<any>>>
  ) => {
    overrides = overrides || {}
    return merge({}, objs, overrides)
  }

  return {
    wrapModelCrudsService,
    wrapAllModelCrudsServices,
  }
}

export { create }
