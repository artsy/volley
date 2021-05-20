/**
 * The shape of a calibre page report
 */
export type CalibrePage = {
  id: string
  uuid: string
  name: string
  status: string
  endpoint: string
  canonical: string
  profile: string
  profile_uuid: string
  metrics: CalibreMetric[]
}

export type CalibreMetric = {
  name: string
  value: number
  /**
   * Accepted values
   *
   * fileSize
   * gradeScore
   * humanDuration
   * milliunit
   * trust
   */
  formatter: string
}
