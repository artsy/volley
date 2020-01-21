const request = require('supertest')
const server = require('../index')

describe("the server's reporting capabilities", () => {
  afterEach(() => {
    server.close()
  })

  it('responds that the server is healthy', async () => {
    const response = await request(server).get('/health')
    expect(response.status).toBe(200)
    expect(response.text).toBe('OK')
  })

  it('reports a given metric', async () => {
    let payload = {
      serviceName: 'my-service',
      metrics: [
        {
          type: 'timing',
          name: 'elapsed-time',
          value: 12345,
          tags: ['tag-name:tag-arg'],
        },
      ],
    }
    const response = await request(server)
      .post('/report')
      .send(payload)
    expect(response.status).toBe(202)
    expect(response.text).toBe('OK')
  })

  describe('concerning the cloud flare error route', () => {
    it('responds with 404 if required parameters missing', async () => {
      const response = await request(server).get('/cloudflareError.png')
      expect(response.status).toBe(404)
    })

    it('responds with 404 if invalid cloudflareErrorType', async () => {
      const response = await request(server)
        .get('/cloudflareError.png?cloudflareErrorType=100')
        .query({
          cloudflareErrorType: '100',
          rayID: '1jud78flight87gh',
          clientIP: '70.80.171.192',
        })
      expect(response.status).toBe(404)
    })

    it('responds with 404 if invalid RayID', async () => {
      const response = await request(server)
        .get('/cloudflareError.png')
        .query({
          cloudflareErrorType: '1000',
          rayID: 'foo',
          clientIP: '70.80.171.192',
        })
      expect(response.status).toBe(404)
    })

    it('responds with 404 if invalid clientIP', async () => {
      const response = await request(server)
        .get('/cloudflareError.png')
        .query({
          cloudflareErrorType: '1000',
          rayID: '1jud78flight87gh',
          clientIP: 'bar',
        })
      expect(response.status).toBe(404)
    })

    it('responds with 200 if called with valid parameters and an ipv4 address', async () => {
      const response = await request(server)
        .get('/cloudflareError.png')
        .query({
          cloudflareErrorType: '500',
          rayID: '1jud78flight87gh',
          clientIP: '70.80.171.192',
        })
      expect(response.status).toBe(200)
    })

    it('responds with 200 if called with valid parameters and an ipv6 address', async () => {
      const response = await request(server)
        .get('/cloudflareError.png')
        .query({
          cloudflareErrorType: '500',
          rayID: '1jud78flight87gh',
          clientIP: '2607:fb90:1b6d:1be4:cc9c:67a6:9e00:2229',
        })
      expect(response.status).toBe(200)
    })
  })
})
