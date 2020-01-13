const sslify = require('koa-sslify').default
const Koa = require('koa')
const cors = require('@koa/cors')
const router = require('koa-router')()
const koaBody = require('koa-body')
const { StatsD } = require('node-dogstatsd')
const ipAddress = require('ip-address')
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
  NODE_ENV,
} = process.env

const app = new Koa()

// Make sure we're using SSL
if (NODE_ENV !== 'development' && NODE_ENV !== 'test') {
  app.use(sslify())
}

const globalTags = GLOBAL_TAGS && GLOBAL_TAGS.split(',')

let metricNameWhitelist = []
if (METRIC_NAME_WHITELIST) {
  metricNameWhitelist = metricNameWhitelist.concat(
    METRIC_NAME_WHITELIST.split(',')
  )
}

let metricTagWhitelist = []
if (METRIC_TAG_WHITELIST) {
  metricTagWhitelist = metricTagWhitelist.concat(
    METRIC_TAG_WHITELIST.split(',')
  )
}

const validCloudFlareErrorTypes = ['500', '1000']
const rayIDLen = 16

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
  metricNameWhitelist,
  metricTagWhitelist
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
    if (
      !('cloudflareErrorType' in ctx.query) ||
      !('rayID' in ctx.query) ||
      !('clientIP' in ctx.query)
    ) {
      console.error('Missing required parameters')
      ctx.status = 404
    } else if (
      !validCloudFlareErrorTypes.includes(ctx.query['cloudflareErrorType'])
    ) {
      console.error(
        `Unregistered error type ${ctx.query['cloudflareErrorType']}`
      )
      ctx.status = 404
    } else if (ctx.query['rayID'].length != rayIDLen) {
      console.error(`Invalid Ray ID ${ctx.query['rayID']}`)
      ctx.status = 404
    } else if (
      !new ipAddress.Address4(ctx.query['clientIP']).isValid() &&
      !new ipAddress.Address6(ctx.query['clientIP']).isValid()
    ) {
      console.error(`Invalid client IP ${ctx.query['clientIP']}`)
      ctx.status = 404
    } else {
      postMetric('volley', {
        type: 'increment',
        name: 'cloudflareError',
        sampleRate: 1,
        tags: ['cloudflareErrorType:' + ctx.query['cloudflareErrorType']],
      })
      console.log(
        `Cloudflare Error -- Type: ${ctx.query['cloudflareErrorType']} -- Ray ID: ${ctx.query['rayID']} -- Client IP: ${ctx.query['clientIP']}`
      )
      ctx.type = 'image/png'
      ctx.body = tracker
    }
  })

app.use(cors())
app.use(koaBody())
app.use(router.routes())

module.exports = app.listen(PORT)

console.log(`Listening on port ${PORT}`)
