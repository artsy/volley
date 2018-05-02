const Koa = require("koa")
const router = require('koa-router')();
const koaBody = require('koa-body');
const { StatsD } = require("node-dogstatsd")

const {
  NODE_ENV = 'development',
  PORT = 5500,
  STATSD_HOST,
  STATSD_PORT, 
} = process.env

const app = new Koa()

// const globalTags = [`env:${NODE_ENV}`]
// const statsdClient = new StatsD(STATSD_HOST, STATSD_PORT, null, [""])
// function postMetric(serviceName, metricType, metricData) {
//   const metricName = `${serviceName}.${metricData[0]}`
//   const metricArgs = metricData.slice(1)
//   statsdClient[metricType].call(statsdClient, metricName, ...metricArgs)
// }

function postMetricDebug(serviceName, metricType, metricData) {
  const metricParams = [serviceName + '.' + metricData[0]]
    .concat(metricData.slice(1))
    .map(item => JSON.stringify(item))
    .join(", ")
  console.log(`demo (without global tags): statsdClient.${metricType}(${metricParams})`)
}

router.post('/report', async (ctx) => {
  const {
    serviceName,
    metrics
  } = ctx.request.body
  metrics.forEach(metric => {
    postMetricDebug(serviceName, metric.type, metric.data)
  })
  ctx.response.status = 202
  ctx.response.body = "OK"
})

app.use(koaBody())
app.use(router.routes())
app.listen(PORT)
