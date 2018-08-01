const Prometheus = require('prom-client')

Prometheus.collectDefaultMetrics()

const resolverTimingMetric = new Prometheus.Gauge({
  name: 'resolver_timing_ms',
  help: 'Time period between request and response in milliseconds',
  labelNames: ['type', 'name']
})

const requestsResolvedMetric = new Prometheus.Counter({
  name: 'requests_resolved',
  help: 'Number of requests resolved by server',
  labelNames: ['type']
})

exports.getMetrics = async (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
}

exports.updateResolverMetrics = (resolverMapping, responseTime) => {
  let {type: resolverMappingType, field: resolverMappingName} = resolverMapping

  resolverTimingMetric
    .labels(resolverMappingType, resolverMappingName)
    .set(responseTime)
  requestsResolvedMetric
    .labels(resolverMappingType)
    .inc(1)
}
