import { assert } from 'chai'

describe('/src/index.ts', () => {
  it('should be able to be imported', async () => {
    const instance = import('../../src/index.js')
    assert.isOk(instance)
  })
})
