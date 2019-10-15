const assert = require('assert')
const sinon = require('sinon')
const request = require('supertest')
const server = require('./index')
const initializePostMetric = require('./src/postMetric')

describe("the server's reporting capabilities", () => {
  afterEach(() => {
    server.close()
  })

  it("responds that the server is healthy", async () => {
    const response = await request(server).get("/health")
    assert(response.status === 200)
    assert(response.text === 'OK')
  })

  it("reports a given metric", async () => {
    let payload = {
      "serviceName": "my-service",
      "metrics": [
        {
          "type": "timer",
          "name": "elapsed-time",
          "value": 12345,
          "tags": ["tag-name:tag-arg"]
        }
      ]
    }
    const response = await request(server).post("/report").send(payload)
    assert(response.status === 202)
    assert(response.text === 'OK')
  })

  describe("concerning the cloud flare error route", () => {
    it("responds with 404 if required parameters missing", async () => {
      const response = await request(server).get("/cloudflareError.png")
      assert(response.status === 404)
    })

    it("responds with 404 if invalid cloudflareErrorType", async () => {
      const response = await request(server).get("/cloudflareError.png?cloudflareErrorType=100").query({ cloudflareErrorType: '100', rayID: '1jud78flight87gh', clientIP: '127.0.0.1' })
      assert(response.status === 404)
    })

    it("responds with 404 if invalid RayID", async () => {
      const response = await request(server).get("/cloudflareError.png").query({ cloudflareErrorType: '100', rayID: 'foo', clientIP: '127.0.0.1' })
      assert(response.status === 404)
    })

    it("responds with 404 if invalid clientIP", async () => {
      const response = await request(server).get("/cloudflareError.png").query({ cloudflareErrorType: '100', rayID: '1jud78flight87gh', clientIP: 'bar' })
      assert(response.status === 404)
    })

    it("responds with 200 if called with valid parameters", async () => {
      const response = await request(server).get("/cloudflareError.png").query({ cloudflareErrorType: '500', rayID: '1jud78flight87gh', clientIP: '127.0.0.1' })
      assert(response.status === 200)
    })
  })
})

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
