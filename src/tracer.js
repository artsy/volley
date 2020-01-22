const tracer = require('dd-trace')

module.exports = function init() {
  const ddServicePrefix = 'volley'

  tracer.init({
    service: `${ddServicePrefix}`,
    hostname: process.env.DATADOG_AGENT_HOSTNAME,
  })

  tracer.use('koa', {
    service: `${ddServicePrefix}`,
  })

  tracer.use('http', {
    service: `${ddServicePrefix}.http`,
  })

  tracer.use('dns', {
    service: `${ddServicePrefix}.dns`,
  })
}
