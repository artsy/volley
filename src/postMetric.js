module.exports = function initialize(
  statsdClient,
  metricNameWhitelist,
  metricTagWhitelist
) {
  return function postMetric(serviceName, metricData) {
    if (metricNameWhitelist.length && !metricNameWhitelist.includes(metricData.name)) {
      console.error(`Metric name "${metricData.name}" not in white list.`)
    } else if (
      metricTagWhitelist.length &&
      metricData.tags &&
      metricData.tags.some(tag => !metricTagWhitelist.includes(tag))
    ) {
      console.error(
        `Metric tags "${metricData.tags}" has tags not in white list.`
      )
    } else if (
      (!metricData.tags || !metricData.tags.length) &&
      metricTagWhitelist.length &&
      !metricTagWhitelist.includes('_')
    ) {
      console.error(
        `Metric tags were empty or absent, but white list does not include "_".`
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
  }
}
