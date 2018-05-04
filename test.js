const assert = require('assert')
const sinon = require('sinon')
const initializePostMetric = require('./src/postMetric')

describe('postMetric', () => {
  let statsdClient
  let postMetric

  beforeEach(() => {
    statsdClient = {
      timing: sinon.spy(),
      increment: sinon.spy(),
      incrementBy: sinon.spy(),
      decrement: sinon.spy(),
      decrementBy: sinon.spy(),
      gauge: sinon.spy(),
      histogram: sinon.spy(),
      set: sinon.spy(),
    }
  })

  describe('with no whitelists', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, null, null)
    })

    it('should call statsdClient.histogram when there are no whitelists', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
      })
      assert(statsdClient.histogram.called)
    })
  })

  describe('with a name whitelist containing only "valid-stat"', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, ['valid-stat'], null)
    })

    it('should call statsdClient.histogram for name "valid-stat"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'valid-stat',
        value: 123,
      })
      assert(statsdClient.histogram.called)
    })

    it('should not call statsdClient.histogram for name "invalid-stat"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'invalid-stat',
        value: 123,
      })
      assert(statsdClient.histogram.notCalled)
    })
  })

  describe('with a tag whitelist containing only "valid-tag:valid-value"', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, null, [
        'valid-tag:valid-value',
      ])
    })

    it('should call statsdClient.histogram for tag "valid-tag:valid-value"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
        tags: ['valid-tag:valid-value'],
      })
      assert(statsdClient.histogram.called)
    })

    it('should not call statsdClient.histogram with no tags', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
      })
      assert(statsdClient.histogram.notCalled)
    })

    it('should not call statsdClient.histogram with tag "invalid-tag:invalid-value"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
        tags: ['invalid-tag:invalid-value'],
      })
      assert(statsdClient.histogram.notCalled)
    })
  })

  describe('with a tag whitelist containing only "_"', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, null, ['_'])
    })

    it('should call statsdClient.histogram with no tags', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
      })
      assert(statsdClient.histogram.called)
    })
  })
})
