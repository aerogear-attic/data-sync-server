const Prometheus = require('prom-client')
const { buildPath } = require('../lib/util/logger')

Prometheus.collectDefaultMetrics()

const resolverTimingMetric = new Prometheus.Gauge({
  name: 'resolver_timing_ms',
  help: 'Time period between request and response in milliseconds',
  labelNames: ['datasource_type', 'operation_type', 'name']
})

const requestsResolvedMetric = new Prometheus.Counter({
  name: 'requests_resolved',
  help: 'Number of requests resolved by server',
  labelNames: ['datasource_type', 'operation_type', 'path']
})

exports.getMetrics = async (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
}

exports.updateResolverMetrics = (resolverInfo, responseTime) => {
  const {
    operation: {operation: resolverMappingType},
    fieldName: resolverMappingName,
    path: resolverWholePath,
    parentType: resolverParentType,
    dataSourceType
  } = resolverInfo

  resolverTimingMetric
    .labels(dataSourceType, resolverMappingType, resolverMappingName)
    .set(responseTime)

  requestsResolvedMetric
    .labels(
      dataSourceType,
      resolverMappingType,
      `${resolverParentType}.${buildPath(resolverWholePath)}`
    )
    .inc(1)
}
