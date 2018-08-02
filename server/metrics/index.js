const Prometheus = require('prom-client')
const { buildPath } = require('../lib/util/logger')

Prometheus.collectDefaultMetrics()

const resolverTimingMetric = new Prometheus.Gauge({
  name: 'resolver_timing_ms',
  help: 'Resolver response time in milliseconds',
  labelNames: ['datasource_type', 'operation_type', 'name']
})

const resolverRequestsMetric = new Prometheus.Counter({
  name: 'requests_resolved',
  help: 'Number of requests resolved by server',
  labelNames: ['datasource_type', 'operation_type', 'path']
})

const serverResponseMetric = new Prometheus.Gauge({
  name: 'server_response_ms',
  help: 'Server response time in milliseconds',
  labelNames: ['request_type', 'error']
})

exports.getMetrics = (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
}

exports.responseLoggingMetric = (req, res, next) => {
  const requestMethod = req.method

  res['requestStart'] = Date.now()

  res.on('finish', onResFinished)
  res.on('error', onResFinished)

  if (next) next()

  function onResFinished (err) {
    this.removeListener('error', onResFinished)
    this.removeListener('finish', onResFinished)
    const responseTime = Date.now() - this.requestStart

    serverResponseMetric
      .labels(requestMethod, err === true)
      .set(responseTime)
  }
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

  resolverRequestsMetric
    .labels(
      dataSourceType,
      resolverMappingType,
      `${resolverParentType}.${buildPath(resolverWholePath)}`
    )
    .inc(1)
}
