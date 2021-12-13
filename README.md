# Volley
Datadog Agent proxy service for client-side metrics collection.

## Meta [![CircleCI](https://circleci.com/gh/artsy/volley/tree/main.svg?style=svg&circle-token=93f0f535305caf8dc13f6fbc7ff36e9062598937)](https://circleci.com/gh/artsy/volley/tree/main) [![codecov](https://codecov.io/gh/artsy/volley/branch/main/graph/badge.svg)](https://codecov.io/gh/artsy/volley)

* **State:** Early production
* **Production:** [http://volley.artsy.net](http://volley.artsy.net) | [k8s](https://kubernetes.prd.artsy.systems/#!/deployment/default/volley-web?namespace=default)
* **Staging:** [http://volley-staging.artsy.net](http://volley-staging.artsy.net) | [k8s](https://kubernetes.stg.artsy.systems/#!/deployment/default/volley-web?namespace=default)
* **CI/Deploys:** [CircleCi](https://circleci.com/gh/artsy/volley); merged PRs to `artsy/volley#main` are automatically deployed to staging; PRs from `staging` to `release` are automatically deployed to production. [Start a deploy...](https://github.com/artsy/volley/compare/release...staging?expand=1)
* **Point People:** [@izakp](https://github.com/izakp)

## Summary

Volley is a thin HTTP wrapper for [node-dogstatsd](https://github.com/mrbar42/node-dogstatsd). It receives metric data from browser applications and forwards it to a Datadog Agent, which in turn handles collection of metrics from multiple sources into Datadog.

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

To run the tests run the following command:
```sh
yarn test
# or
hokusai test
```

## Usage

### Allowlists

Because Datadog plans have an allotment of custom metrics and tags, Metric offers the ability to restrict possible values for metric names and tags that are allowed. The allowlists are managed by environment variables.

* Get the current METRIC_NAME_ALLOWLIST with `hokusai staging env get METRIC_NAME_ALLOWLIST`
* Set its new value with `hokusai staging env set METRIC_NAME_LIST=preexisting-tag:value,new-tag:new-value`
* Refresh the environment with `hokusai staging deployment refresh`
* Do the same thing in `production` when you're satisfied.

### Global tags

The Datadog Agent is already configured to send an `env` tag with all metrics it publishes. If you want to add additional global tags, set the `GLOBAL_TAGS` environment variable to a comma-separated list of tags with the process mentioned in the previous section.

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

## Name

A volley in sports is to knock an airborne ball onward without letting it touch the ground. Or it's a large number of projectiles airborn at once. Either way, it's a vaguely physics-oriented term, because of...motion...and stuff.

Enjoy https://www.youtube.com/watch?v=1C9STKF0Lv4, for an example.

## About Artsy

<a href="https://www.artsy.net/">
  <img align="left" src="https://avatars2.githubusercontent.com/u/546231?s=200&v=4"/>
</a>

This project is the work of engineers at [Artsy][footer_website], the world's
leading and largest online art marketplace and platform for discovering art.
One of our core [Engineering Principles][footer_principles] is being [Open
Source by Default][footer_open] which means we strive to share as many details
of our work as possible.

You can learn more about this work from [our blog][footer_blog] and by following
[@ArtsyOpenSource][footer_twitter] or explore our public data by checking out
[our API][footer_api]. If you're interested in a career at Artsy, read through
our [job postings][footer_jobs]!

[footer_website]: https://www.artsy.net/
[footer_principles]: culture/engineering-principles.md
[footer_open]: culture/engineering-principles.md#open-source-by-default
[footer_blog]: https://artsy.github.io/
[footer_twitter]: https://twitter.com/ArtsyOpenSource
[footer_api]: https://developers.artsy.net/
[footer_jobs]: https://www.artsy.net/jobs
