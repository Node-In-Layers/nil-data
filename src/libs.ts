import kebabCase from 'lodash/kebabCase.js'
import { Model } from 'functional-models/interfaces.js'
import isString from 'lodash/isString.js'

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

export {
  getMongoCollectionNameForModel,
  defaultGetTableNameForModel,
  getSystemInfrastructureName,
}
