const MetricsService = require('../services/MetricsService');

const defaultMetricsService = new MetricsService();

const health = (service = defaultMetricsService) => (req, res) => {
  res.json(service.getHealth());
};

const ready = (service = defaultMetricsService) => async (req, res) => {
  try {
    const readiness = await service.getReadiness();
    res.status(readiness.ready ? 200 : 503).json(readiness);
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
};

const metrics = (service = defaultMetricsService) => async (req, res) => {
  try {
    const data = await service.getMetrics();
    res.json({ success: true, metrics: data });
  } catch (error) {
    console.error('[metrics]', error.message);
    res.status(500).json({ message: 'Error al obtener métricas' });
  }
};

module.exports = {
  health: health(),
  ready: ready(),
  metrics: metrics(),
  _factories: { health, ready, metrics }
};
