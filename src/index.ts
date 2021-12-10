require('dotenv').config()
import { initDataDogTracer } from './app/tracer'

const {
  DEBUG = 'false',
  GLOBAL_TAGS = '',
  METRIC_NAME_ALLOWLIST = null,
  METRIC_TAG_ALLOWLIST = null,
  PORT = 5500,
  STATSD_HOST = 'localhost',
  STATSD_PORT = 8125,
  NODE_ENV,
  DATADOG_AGENT_HOSTNAME,
  SENTRY_DSN,
} = process.env

// Setup DataDog before importing another modules as per the documentation.
if (DATADOG_AGENT_HOSTNAME) {
  initDataDogTracer()
}

import Koa from 'koa'
import Router from '@koa/router'
import sslify, { xForwardedProtoResolver as resolver } from 'koa-sslify'
import cors from '@koa/cors'
import koaBody from 'koa-body'
import { StatsD } from 'node-dogstatsd'
import ipAddress from 'ip-address'
import path from 'path'
import fs from 'fs'
import * as Sentry from '@sentry/node'

import { initialize } from './app/postMetric'
import { calibreWebhookRoute } from './app/calibreWebhookRoute'

const app = new Koa()
const router = new Router()

const tracker = fs.readFileSync(path.resolve(__dirname, '..', 'assets', 'pixel.png'))

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
  })

  app.on('error', err => {
    Sentry.captureException(err)
  })
}

// Make sure we're using SSL
if (NODE_ENV !== 'development' && NODE_ENV !== 'test') {
  app.use(sslify({ resolver }))
}

const globalTags = GLOBAL_TAGS && GLOBAL_TAGS.split(',')
const metricNameAllowlist: string[] = METRIC_NAME_ALLOWLIST ? METRIC_NAME_ALLOWLIST.split(',') : []
const metricTagAllowlist: string[] = METRIC_TAG_ALLOWLIST ? METRIC_TAG_ALLOWLIST.split(',') : []

const validCloudFlareErrorTypes = ['500', '1000']
const rayIDLen = 16

let statsdClient
if (DEBUG === 'true') {
  statsdClient = new Proxy(
    {},
    {
      get(obj, prop: string) {
        return (...args: any[]) => {
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

const postMetric = initialize(
  statsdClient,
  metricNameAllowlist,
  metricTagAllowlist
)

router
  .get('/health', async ctx => {
    ctx.body = 'OK'
  })
  .post("/webhook", calibreWebhookRoute(postMetric))
  .post('/report', async ctx => {
    const { serviceName, metrics } = ctx.request.body
    metrics.forEach((metricData: any) => postMetric(serviceName, metricData))
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

    } else if (!validCloudFlareErrorTypes.includes(ctx.query['cloudflareErrorType'] as string)) {
      console.error(`Unregistered error type ${ctx.query['cloudflareErrorType']}`)
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

export const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
