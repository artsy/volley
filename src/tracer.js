const tracer = require('dd-trace')

module.exports = function init() {
  const ddServicePrefix = 'volley'

  console.log('Tracer init called')

  tracer.init({
    // Setting the service name to  `.undetected` so that we detect services that
    // are running as part of the application, but aren't explicitly configured
    // with `tracer.use`. We want to to explicitly configure services so that we
    // can enforce our `.`-deliminited Service naming convention.
    service: `${ddServicePrefix}.undetected`,
    hostname: process.env.DATADOG_AGENT_HOSTNAME,
  })

  tracer.use('koa', {
    service: `${ddServicePrefix}`,
  })

  tracer.use('http', {
    service: `${ddServicePrefix}.http`,
  })
}
