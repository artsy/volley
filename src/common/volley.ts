import { CalibreMetric } from './calibre'

interface VolleyMetric {
    type: 'timing' | 'increment' | 'incrementBy' | 'decrement' | 'decrementBy' | 'gauge' | 'histogram' | 'set'
    name: string,
    value: number
}

interface VolleySampledMetric extends VolleyMetric {
    sampleRate: number
}

interface VolleyTaggedMetric extends VolleyMetric {
    tags: string[]
}

interface VolleyTaggedSampledMetric extends VolleySampledMetric {
    tags: string[]
}

export type VolleyMetrics = VolleyMetric | VolleySampledMetric | VolleyTaggedMetric | VolleyTaggedSampledMetric

export class VolleyApi {
  public static fromCalibreApi(calibreMetric: CalibreMetric, tags: string[]): VolleyMetrics {
    return {
      type: 'gauge',
      name: calibreMetric.name.replace(/[- ]/g, "_"),
      value: calibreMetric.value,
      tags: tags,
    }
  }
}
