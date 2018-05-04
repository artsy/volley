# Metric

[![CircleCI](https://circleci.com/gh/artsy/metric.svg?style=svg&circle-token=90026ccf3fbb8fd77ccad45fe6f36f853c36e209)](https://circleci.com/gh/artsy/metric)

Datadog Agent proxy service for client-side metrics collection.

## Meta

* **State:** Early production
* **Production:** [http://metric-production.artsy.net](http://metric-production.artsy.net)
* **Staging:** [http://metric-staging.artsy.net](http://metric-staging.artsy.net)
* **Deploys:** Merges to `master` are auto-deployed to staging. Run `hokusai pipeline promote` to promote staging to production. See the [Hokusai docs](https://github.com/artsy/hokusai/blob/master/docs/Getting_Started.md) for other operational details.
* **CI**: [Circle CI](https://circleci.com/gh/artsy/metric)
* **Point People:** [@acjay](https://github.com/acjay)

## Summary

Metric is a thin HTTP wrapper for [node-dogstatsd](https://github.com/mrbar42/node-dogstatsd). It receives metric data from browser applications and forwards it to a Datadog Agent, which in turn handles collection of metrics from multiple sources into Datadog.

## Development

### Datadog local setup

* Install the [Datadog Agent](https://docs.datadoghq.com/agent/) locally.
* Enter the management interface.
* Set up the API key.
* To avoid publishing your computer's system metrics, disable all the local checks.

### Running locally

Development is done via [Hokusai](https://github.com/artsy/hokusai) (follow the setup instructions in that readme). Then you may run the following command:

```sh
hokusai dev start
```

That will build a Docker container with the app's dependencies. You can also run development outside Docker, via `yarn install` and `yarn start` (run `npm install -g yarn`, if you don't already have Yarn).

## Usage

### Whitelists

Because Datadog plans have an allotment of custom metrics and tags, Metric offers the ability to restrict possible values for metric names and tags that are allowed. The whitelists are managed by environment variables.

* TODO insert example of adding a metric name

### Publishing metrics

From a client application, make a POST request to the `/report` endpoint. Example:

```javascript
// TODO
```

You may push multiple metrics in one payload. In all situations, Metric will respond with status code 202 and the text "OK", so watch Datadog for metrics appearing and [Metric's logs]() for errors.

The following payload demonstrates the format of all possible metric types:

```javascript
{
	"serviceName": "client-service",
	"metrics": [
		{
			"type": "timer",
			"name": "elapsed-time",  
			"value": 12345,
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "increment",
			"name": "count",  
			"sampleRate": 1, // optional; defaults to 1
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "incrementBy",
			"name": "count",  
			"value": 5,
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "decrement",
			"name": "count",  
			"sampleRate": 3, // optional; defaults to 1
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "decrementBy",
			"name": "count",  
			"value": 3,
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "gauge",
      "name": "stat",  
      "sampleRate": 2,  // optional; defaults to 1
			"value": 12345,
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "histogram",
			"name": "stat",  
      "value": 4567,
      "sampleRate": 6,
			"tags": ["tag-name:tag-arg"]
		},
		{
			"type": "set",
			"name": "tracked-items",  
			"value": "item",
			"tags": ["tag-name:tag-arg"]
		}
	]
}
```
