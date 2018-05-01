const Koa = require("koa")
const router = require('koa-router')();
const koaBody = require('koa-body');
const { StatsD } = require("node-dogstatsd")

const {
  PORT = 5500,
  STATSD_HOST,
  STATSD_PORT, 
} = process.env

const app = new Koa()

// const statsdClient = new StatsD(STATSD_HOST, STATSD_PORT)
// function postMetric(serviceName, metricType, metricData) {
//   const metricName = [serviceName + '.' + metricData[0]]
//   const metricArgs = metricData.slice(1)
//   statsdClient[metricType].call(statsdClient, metricName, ...metricArgs)
// }

function postMetricDebug(serviceName, metricType, metricData) {
  const metricParams = [serviceName + '.' + metricData[0]]
    .concat(metricData.slice(1))
    .map(item => typeof item === "string" ?`"${item}"` : `${item}`)
    .join(", ")
  console.log(`statsdClient.${metricType}(${metricParams})`)
}

router.post('/report', async (ctx) => {
  const {
    serviceName,
    metrics
  } = ctx.request.body
  metrics.forEach(metric => {
    postMetricDebug(serviceName, metric.type, metric.data)
  })
})

app.use(koaBody())
app.use(router.routes())
app.listen(PORT)
