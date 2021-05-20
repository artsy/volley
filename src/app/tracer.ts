import tracer from 'dd-trace'

export const initDataDogTracer = () => {
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
