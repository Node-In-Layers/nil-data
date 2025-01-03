import { Config, FeaturesContext } from '@node-in-layers/core/index.js'
import { NilDbServicesLayer, NilDbFeaturesLayer } from './types.js'

const create = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: FeaturesContext<Config, NilDbServicesLayer, NilDbFeaturesLayer>
) => {
  return {}
}

export { create }
