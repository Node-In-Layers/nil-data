import { assert } from 'chai'
import { create } from '../../src/services.js'

describe('/src/services.ts', () => {
  describe('#getDatabases()', () => {
    it('should create configured default and named databases', () => {
      const input = {
        context: {
          config: {
            environment: 'test',
            systemName: 'my-system',
            '@node-in-layers/data': {
              databases: {
                default: {
                  datastoreType: 'memory',
                },
                reporting: {
                  datastoreType: 'memory',
                },
              },
            },
          },
        },
      }

      const instance = create(input.context as any)
      const actual = Object.keys(instance.getDatabases())
      const expected = ['default', 'reporting']

      assert.deepEqual(actual, expected)
    })
  })

  describe('#getModelProps()', () => {
    it('should use the default datastore when only crossLayerProps are provided', () => {
      const input = {
        context: {
          config: {
            environment: 'test',
            systemName: 'my-system',
            '@node-in-layers/data': {
              databases: {
                default: {
                  datastoreType: 'memory',
                },
              },
            },
          },
        },
      }

      const instance = create(input.context as any)
      const actual = instance.getModelProps(
        input.context as any,
        {
          logging: {
            ids: [{ requestId: 'request-1' }],
          },
        } as any
      )

      assert.isFunction(actual.Model)
      assert.isFunction(actual.fetcher)
    })

    it('should throw when requesting an unknown datastore name', () => {
      const input = {
        context: {
          config: {
            environment: 'test',
            systemName: 'my-system',
            '@node-in-layers/data': {
              databases: {
                default: {
                  datastoreType: 'memory',
                },
              },
            },
          },
        },
      }

      const instance = create(input.context as any)

      assert.throws(() => {
        instance.getModelProps(input.context as any, 'missing')
      }, 'No database named missing')
    })
  })
})
