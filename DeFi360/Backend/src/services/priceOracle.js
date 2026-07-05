const SimulatedOracleAdapter = require('./SimulatedOracleAdapter');
const CachedPriceOracle = require('./CachedPriceOracle');
const CircuitBreakerOracle = require('./CircuitBreakerOracle');

const adapter = new SimulatedOracleAdapter();
const cached = new CachedPriceOracle(adapter);
const oracle = new CircuitBreakerOracle(cached);

oracle.adapter = adapter;
oracle.cache = cached;

module.exports = oracle;
