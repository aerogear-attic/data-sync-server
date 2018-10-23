const Prometheus = require('prom-client')
const { buildPath } = require('@aerogear/data-sync-gql-core').util.graphqlPathUtil

Prometheus.collectDefaultMetrics()

const resolverTimingMetric = new Prometheus.Histogram({
  name: 'resolver_timing_ms',
  help: 'Resolver response time in milliseconds',
  labelNames: ['datasource_type', 'operation_type', 'name']
})

const resolverRequestsMetric = new Prometheus.Counter({
  name: 'requests_resolved',
  help: 'Number of requests resolved by server',
  labelNames: ['datasource_type', 'operation_type', 'path']
})

const resolverRequestsTotalMetric = new Prometheus.Counter({
  name: 'requests_resolved_total',
  help: 'Number of requests resolved by server in total',
  labelNames: ['datasource_type', 'operation_type', 'path']
})

const serverResponseMetric = new Prometheus.Histogram({
  name: 'server_response_ms',
  help: 'Server response time in milliseconds',
  labelNames: ['request_type', 'error']
})

exports.getMetrics = (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())

  resolverTimingMetric.reset()
  resolverRequestsMetric.reset()
  serverResponseMetric.reset()
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
      .labels(requestMethod, err !== undefined || res.statusCode > 299)
      .observe(responseTime)
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
    .observe(responseTime)

  resolverRequestsMetric
    .labels(
      dataSourceType,
      resolverMappingType,
      `${resolverParentType}.${buildPath(resolverWholePath)}`
    )
    .inc(1)

  resolverRequestsTotalMetric
    .labels(
      dataSourceType,
      resolverMappingType,
      `${resolverParentType}.${buildPath(resolverWholePath)}`
    )
    .inc(1)
}
