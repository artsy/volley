const Koa = require('koa')
const router = require('koa-router')()
const koaBody = require('koa-body')
const { StatsD } = require('node-dogstatsd')
const initializePostMetric = require('./src/postMetric')

const {
  DEBUG = 'false',
  METRIC_NAME_WHITELIST = null,
  METRIC_TAG_WHITELIST = null,
  NODE_ENV = 'development',
  PORT = 5500,
  STATSD_HOST = 'localhost',
  STATSD_PORT = 8125,
} = process.env

const app = new Koa()

const globalTags = [`env:${NODE_ENV}`]

let statsdClient
if (DEBUG === 'true') {
  statsdClient = new Proxy(
    {},
    {
      get(obj, prop) {
        return (...args) => {
          const argsStr = JSON.stringify(args).slice(1, -1)
          const globalTagsStr = JSON.stringify(globalTags)
          console.log(
            `statsdClient.${prop}(${argsStr}}) [with global tags: ${globalTagsStr}]`
          )
        }
      },
    }
  )
} else {
  statsdClient = new StatsD(STATSD_HOST, STATSD_PORT, null, {
    global_tags: globalTags,
  })
}

const postMetric = initializePostMetric(
  statsdClient,
  METRIC_NAME_WHITELIST,
  METRIC_TAG_WHITELIST
)

router
  .get('/health', async ctx => {
    ctx.render('OK')
  })
  .post('/report', async ctx => {
    const { serviceName, metrics } = ctx.request.body
    metrics.forEach(metricData => postMetric(serviceName, metricData))
    ctx.response.status = 202
    ctx.response.body = 'OK'
  })

app.use(koaBody())
app.use(router.routes())
app.listen(PORT)

console.log(`Listening on port ${PORT}`)
