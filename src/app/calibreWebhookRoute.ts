import { CalibrePage } from '../common/calibre'
import { VolleyApi } from '../common/volley'
import Koa from 'koa'
import Router from '@koa/router'
import type { postMetric } from './postMetric'

const CALIBRE_SERVICE_PREFIX = process.env.CALIBRE_SERVICE_PREFIX || 'calibre'

function sanitize(data: string): string {
  return data.replace(/[- ]/g, "_")
}

export const calibreWebhookRoute = (postMetric: postMetric) => {
  return (ctx: Koa.ParameterizedContext<any, Router.RouterParamContext<any, {}>, any>) => {
    const siteId = sanitize(ctx.request.body.site_id)

    const pages = ctx.request.body.pages as CalibrePage[]
    for (let page of pages) {
      const pageId = sanitize(page.id)
      const pageDevice = sanitize(page.profile).toLowerCase()
      const deviceType = (pageDevice === 'chrome_desktop') ? 'desktop' : 'mobile'

      for (let metric of page.metrics) {
        const prefix = `${CALIBRE_SERVICE_PREFIX}.${siteId}`

        const volley = VolleyApi.fromCalibreApi(metric, [
          `form:${deviceType}`, `mode:${pageDevice}`, `page:${pageId}`
        ])

        postMetric(prefix, volley, true)
      }
    }

    ctx.status = 202
    ctx.body = 'OK'
  }
}
