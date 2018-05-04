const Koa = require('koa')
const router = require('koa-router')()
const koaBody = require('koa-body')
const { StatsD } = require('node-dogstatsd')

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

function postMetric(serviceName, metricData) {
  if (
    METRIC_NAME_WHITELIST &&
    !METRIC_NAME_WHITELIST.includes(metricData.name)
  ) {
    console.error(`Metric name "${metricData.name}" not in white list.`)
  } else if (
    METRIC_TAG_WHITELIST &&
    metricData.tags.some(tag => !METRIC_TAG_WHITELIST.includes(tag))
  ) {
    console.error(
      `Metric tags "${metricData.tags}" has tags not in white list.`
    )
  } else {
    const metricName = `${serviceName}.${metricData.name}`

    switch (metricData.type) {
      case 'timing':
        statsdClient.timing(
          metricName,
          metricData.timing,
          metricData.sampleRate,
          metricData.tags
        )
        break

      case 'increment':
        statsdClient.increment(
          metricName,
          metricData.sampleRate,
          metricData.tags
        )
        break

      case 'incrementBy':
        statsdClient.incrementBy(metricName, metricData.value, metricData.tags)
        break

      case 'decrement':
        statsdClient.decrement(
          metricName,
          metricData.sampleRate,
          metricData.tags
        )
        break

      case 'decrementBy':
        statsdClient.decrementBy(metricName, metricData.value, metricData.tags)
        break

      case 'gauge':
        statsdClient.gauge(
          metricName,
          metricData.value,
          metricData.sampleRate,
          metricData.tags
        )
        break

      case 'histogram':
        statsdClient.histogram(
          metricName,
          metricData.value,
          metricData.sampleRate,
          metricData.tags
        )
        break

      case 'set':
        statsdClient.set(
          metricName,
          metricData.value,
          metricData.sampleRate,
          metricData.tags
        )
        break

      default:
        console.error(`Unrecognized metric type: "${metricData.type}".`)
    }
  }
}

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
