# Volley

[![CircleCI](https://circleci.com/gh/artsy/volley.svg?style=svg&circle-token=90026ccf3fbb8fd77ccad45fe6f36f853c36e209)](https://circleci.com/gh/artsy/volley)

Datadog Agent proxy service for client-side metrics collection.

## Meta

* **State:** Early production
* **Production:** [http://volley.artsy.net](http://volley.artsy.net)
* **Staging:** [http://volley-staging.artsy.net](http://volley-staging.artsy.net)
* **Deploys:** Merges to `master` are auto-deployed to staging. Run `hokusai pipeline promote` to promote staging to production. See the [Hokusai docs](https://github.com/artsy/hokusai/blob/master/docs/Getting_Started.md) for other operational details.
* **CI**: [Circle CI](https://circleci.com/gh/artsy/volley)
* **Point People:** [@acjay](https://github.com/acjay)

## Summary

Metric is a thin HTTP wrapper for [node-dogstatsd](https://github.com/mrbar42/node-dogstatsd). It receives metric data from browser applications and forwards it to a Datadog Agent, which in turn handles collection of volleys from multiple sources into Datadog.

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

Because Datadog plans have an allotment of custom volleys and tags, Metric offers the ability to restrict possible values for volley names and tags that are allowed. The whitelists are managed by environment variables.

* Get the current METRIC_NAME_WHITELIST with `hokusai staging env get METRIC_NAME_WHITELIST`
* Set its new value with `hokusai staging env set METRIC_NAME_WHITELIST=preexisting-tag:value,new-tag:new-value`
* Refresh the environment with `hokusai staging deployment refresh`
* Do the same thing in `production` when you're satisfied.

### Publishing volleys

From a client application, make a POST request to the `/report` endpoint. Example:

```javascript
// TODO
```

You may push multiple volleys in one payload. In all situations, Metric will respond with status code 202 and the text "OK", so watch Datadog for metrics appearing and [Metric's logs]() for errors.

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
