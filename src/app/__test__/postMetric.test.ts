import { initialize as initializePostMetric } from '../postMetric'

describe('postMetric', () => {
  let statsdClient: any
  let postMetric: any

  beforeEach(() => {
    statsdClient = {
      timing: jest.fn(),
      increment: jest.fn(),
      incrementBy: jest.fn(),
      decrement: jest.fn(),
      decrementBy: jest.fn(),
      gauge: jest.fn(),
      histogram: jest.fn(),
      set: jest.fn(),
    }
    console.error = jest.fn()
  })

  afterEach(() => {
    (console.error as any).mockClear()
  })

  describe('with no allowlists', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, [], [])
    })

    it('should call statsdClient.histogram when there are no allowlists', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
      })
      expect(statsdClient.histogram).toBeCalled()
    })
  })

  describe('with a name allowlist containing only "valid-stat"', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, ['valid-stat'], [])
    })

    it('should call statsdClient.histogram for name "valid-stat"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'valid-stat',
        value: 123,
      })
      expect(statsdClient.histogram).toBeCalled()
    })
    it('should not call statsdClient.histogram for name "invalid-stat"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'invalid-stat',
        value: 123,
      })
      expect(statsdClient.histogram).not.toBeCalled()
      expect(console.error).toBeCalledWith(
        'Metric name "invalid-stat" not in allow list.'
      )
    })
  })

  describe('with a tag allowlist containing only "valid-tag:valid-value"', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(
        statsdClient,
        [],
        ['valid-tag:valid-value']
      )
    })

    it('should call statsdClient.histogram for tag "valid-tag:valid-value"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
        tags: ['valid-tag:valid-value'],
      })
      expect(statsdClient.histogram).toBeCalled()
    })

    it('should not call statsdClient.histogram with no tags', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
      })
      expect(statsdClient.histogram).not.toBeCalled()
      expect(console.error).toBeCalledWith(
        'Metric tags were empty or absent, but allow list does not include "_".'
      )
    })

    it('should not call statsdClient.histogram with tag "invalid-tag:invalid-value"', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
        tags: ['invalid-tag:invalid-value'],
      })
      expect(statsdClient.histogram).not.toBeCalled()
      expect(console.error).toBeCalledWith(
        'Metric tags "invalid-tag:invalid-value" has tags not in allow list.'
      )
    })
  })

  describe('with a tag allowlist containing only "_"', () => {
    beforeEach(() => {
      postMetric = initializePostMetric(statsdClient, [], ['_'])
    })

    it('should call statsdClient.histogram with no tags', () => {
      postMetric('my-service', {
        type: 'histogram',
        name: 'stat',
        value: 123,
      })
      expect(statsdClient.histogram).toBeCalled()
    })
  })
})
