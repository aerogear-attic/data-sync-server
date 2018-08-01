const Prometheus = require('prom-client')

Prometheus.collectDefaultMetrics()

exports.getMetrics = async (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
}
