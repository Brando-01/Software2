const RiskMonitoringService = require('./RiskMonitoringService');
const NotificationService = require('./NotificationService');
const LiquidationService = require('./LiquidationService');
const LiquidationObserver = require('./LiquidationObserver');

const notificationService = new NotificationService();
const liquidationService = new LiquidationService({ notificationService });

const riskMonitoringService = new RiskMonitoringService();

riskMonitoringService.subscribe(notificationService);

const liquidationObserver = new LiquidationObserver(liquidationService);
riskMonitoringService.subscribe(liquidationObserver);

module.exports = {
  riskMonitoringService,
  notificationService,
  liquidationService,
  liquidationObserver
};
