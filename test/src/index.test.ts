import { assert } from 'chai'

describe('/src/index.ts', () => {
  it('should export the current package surface', async () => {
    const instance = await import('../../src/index.js')

    assert.isOk(instance)
    assert.equal(instance.name, '@node-in-layers/data')
    assert.isOk(instance.services)
    assert.isUndefined((instance as Record<string, unknown>).features)
    assert.isUndefined(
      (instance as Record<string, unknown>).ModelCrudsInterface
    )
  })
})
