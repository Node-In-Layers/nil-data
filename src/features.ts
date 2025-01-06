import { Config, FeaturesContext } from '@node-in-layers/core/index.js'
import {
  DataServicesLayer,
  DataFeaturesLayer,
  DataFeatures,
  ModelCrudsInterface,
} from './types.js'
import { FunctionalModel } from 'functional-models/interfaces.js'

const create = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: FeaturesContext<Config, DataServicesLayer, DataFeaturesLayer>
): DataFeatures => {
  const wrapModelCrudsService = <T extends FunctionalModel>(
    modelCruds: ModelCrudsInterface<T>,
    overrides: Partial<ModelCrudsInterface<T>>
  ) => {
    return {
      ...modelCruds,
      ...overrides,
    }
  }

  return {
    wrapModelCrudsService,
  }
}

export { create }
