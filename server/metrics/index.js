const Prometheus = require('prom-client')

Prometheus.collectDefaultMetrics()

const resolverTiming = new Prometheus.Gauge({
  name: 'resolver_timing_ms',
  help: 'Time period between request and response in milliseconds',
  labelNames: ['type', 'name']
})

exports.getMetrics = async (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
}

exports.updateResolverMetrics = (resolverMapping, responseTime) => {
  resolverTiming
    .labels(resolverMapping.type, resolverMapping.field)
    .set(responseTime)
}
