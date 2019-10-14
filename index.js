const Koa = require('koa')
const cors = require('@koa/cors')
const router = require('koa-router')()
const koaBody = require('koa-body')
const { StatsD } = require('node-dogstatsd')
const initializePostMetric = require('./src/postMetric')
const path = require('path')
const fs = require('fs')
const tracker = fs.readFileSync(path.join(__dirname, 'assets', 'pixel.png'))

const {
  DEBUG = 'false',
  GLOBAL_TAGS = '',
  METRIC_NAME_WHITELIST = null,
  METRIC_TAG_WHITELIST = null,
  PORT = 5500,
  STATSD_HOST = 'localhost',
  STATSD_PORT = 8125,
} = process.env

const app = new Koa()

const globalTags = GLOBAL_TAGS && GLOBAL_TAGS.split(',')

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
    ctx.body = 'OK'
  })
  .post('/report', async ctx => {
    const { serviceName, metrics } = ctx.request.body
    metrics.forEach(metricData => postMetric(serviceName, metricData))
    ctx.status = 202
    ctx.body = 'OK'
  })
  .get('/cloudflareError.png', async ctx => {
    if (ctx.query['type'] == undefined || ctx.query['ray-id'] == undefined || ctx.query['client-ip'] == undefined) {
      ctx.status = 404
    }
    else {
      postMetric("volley", {
        "type": "increment",
        "name": "cloudflareError",
        "sampleRate": 1,
        "tags": ["type:" + ctx.query['type']]
      })
      console.log('Cloudflare Error -- Type: ' + ctx.query['type'] + ' -- Ray ID: ' + ctx.query['ray-id'] + ' -- Client IP: ' + ctx.query['client-ip'])
      ctx.type = 'image/png'
      ctx.body = tracker
    }
  })

app.use(cors())
app.use(koaBody())
app.use(router.routes())
app.listen(PORT)

console.log(`Listening on port ${PORT}`)
