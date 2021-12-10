export type postMetric = (serviceName: string, metricData: object, skipAllowlistCheck?: boolean) => void

export const initialize = (
  statsdClient: any,
  metricNameAllowlist: any,
  metricTagAllowlist: any
): postMetric => {

  function isAllowlisted(metricData: any) {
    if (metricNameAllowlist.length && !metricNameAllowlist.includes(metricData.name)) {
      console.error(`Metric name "${metricData.name}" not in allow list.`)
      return false
    } else if (
      metricTagAllowlist.length &&
      metricData.tags &&
      metricData.tags.some((tag: string) => !metricTagAllowlist.includes(tag))
    ) {
      console.error(`Metric tags "${metricData.tags}" has tags not in allow list.`)
      return false
    } else if (
      (!metricData.tags || !metricData.tags.length) &&
      metricTagAllowlist.length &&
      !metricTagAllowlist.includes('_')
    ) {
      console.error(`Metric tags were empty or absent, but allow list does not include "_".`)
      return false
    }
    return true
  }

  function sendMetric(serviceName: string, metricData: any) {
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
        statsdClient.incrementBy(
          metricName,
          metricData.value,
          metricData.tags
        )
        break

      case 'decrement':
        statsdClient.decrement(
          metricName,
          metricData.sampleRate,
          metricData.tags
        )
        break

      case 'decrementBy':
        statsdClient.decrementBy(
          metricName,
          metricData.value,
          metricData.tags
        )
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

  return function postMetric(serviceName: string, metricData: any, skipAllowlistCheck = false) {
    if (!skipAllowlistCheck && !isAllowlisted(metricData)) {
      return
    }

    sendMetric(serviceName, metricData)
  }
}
