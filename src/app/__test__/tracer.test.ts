const tracer = require('dd-trace')
const { initDataDogTracer } = require('../tracer')

jest.mock('dd-trace', () => ({
  init: jest.fn(),
  use: jest.fn(),
}))

describe('datadog tracing', () => {
  it('initializes tracer with correct args', () => {
    initDataDogTracer()
    expect(tracer.init).toBeCalledWith({
      service: 'volley',
      hostname: 'test-hostname',
    })
    expect(tracer.use).toBeCalledWith('koa', {
      service: 'volley',
    })
    expect(tracer.use).toBeCalledWith('dns', {
      service: 'volley.dns',
    })
    expect(tracer.use).toBeCalledWith('http', {
      service: 'volley.http',
    })
  })
})
