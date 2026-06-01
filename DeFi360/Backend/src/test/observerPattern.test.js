
const MonitorRiesgo = require('../services/MonitorRiesgo');
const NotificationObserver = require('../services/NotificationObserver');
const LogObserver = require('../services/LogObserver');
const RiskMonitoringService = require('../services/RiskMonitoringService');
const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');
const IRiskObserver = require('../interfaces/IRiskObserver');
const assert = require('assert');

describe('T-14 / HU-08: Patrón Observer - Monitoreo de Riesgos', () => {

    describe('MonitorRiesgo - Gestión de Observers', () => {
        let monitor;
        let mockObserver;

        beforeEach(() => {
            const strategy = new LTVRiskStrategy({
                medium: 50,
                high: 70,
                critical: 80
            });
            monitor = new MonitorRiesgo(strategy);

            // Crear mock observer
            class MockObserver extends IRiskObserver {
                constructor() {
                    super();
                    this.events = [];
                }
                onRiskEvent(event) {
                    this.events.push(event);
                }
            }
            mockObserver = new MockObserver();
        });

        it('✅ Debería suscribir un observer correctamente', () => {
            monitor.subscribe(mockObserver);
            assert.strictEqual(monitor.getObserverCount(), 1, 'Debe haber 1 observer');
        });

        it('✅ Debería desuscribir un observer', () => {
            monitor.subscribe(mockObserver);
            monitor.unsubscribe(mockObserver);
            assert.strictEqual(monitor.getObserverCount(), 0, 'No debe haber observers');
        });

        it('✅ Debería rechazar observers inválidos', () => {
            assert.throws(() => {
                monitor.subscribe({ invalid: true });
            }, /Observer debe implementar onRiskEvent/);
        });
    });

    describe('MonitorRiesgo - Alertas según LTV', () => {
        let monitor;
        let mockObserver;

        beforeEach(() => {
            const strategy = new LTVRiskStrategy({
                medium: 50,
                high: 70,
                critical: 80
            });
            monitor = new MonitorRiesgo(strategy);

            class MockObserver extends IRiskObserver {
                constructor() {
                    super();
                    this.events = [];
                }
                onRiskEvent(event) {
                    this.events.push(event);
                }
            }
            mockObserver = new MockObserver();
            monitor.subscribe(mockObserver);
        });

        it('✅ Debería disparar RISK_ALERT_HIGH cuando LTV >= 90%', async () => {
            const loanMock = { 
                id: 101,
                borrowerId: 'user1',
                lenderId: 'user2',
                amount: 810,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await monitor.evaluateLoanRisk(loanMock, 3000); 

            const alerts = mockObserver.events.filter(e => e.type === 'RISK_ALERT_HIGH');
            assert.strictEqual(alerts.length, 1, 'Debe haber 1 alerta de RIESGO_ALTO');
            assert.strictEqual(alerts[0].ltv, 90, 'LTV debe ser 90%');
            assert.strictEqual(alerts[0].severity, 'HIGH');
        });

        it('✅ Debería disparar RISK_ALERT_CRITICAL cuando LTV >= 95%', async () => {
            const loanMock = { 
                id: 102,
                borrowerId: 'user1',
                lenderId: 'user2',
                amount: 855,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await monitor.evaluateLoanRisk(loanMock, 3000); 
            const alerts = mockObserver.events.filter(e => e.type === 'RISK_ALERT_CRITICAL');
            assert.strictEqual(alerts.length, 1, 'Debe haber 1 alerta CRÍTICA');
            assert.strictEqual(alerts[0].ltv, 95, 'LTV debe ser 95%');
            assert.strictEqual(alerts[0].severity, 'CRITICAL');
        });

        it('✅ NO debería disparar alertas cuando LTV < 90%', async () => {
            const loanMock = { 
                id: 103,
                borrowerId: 'user1',
                lenderId: 'user2',
                amount: 720,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await monitor.evaluateLoanRisk(loanMock, 3000); 

            const alerts = mockObserver.events.filter(e => 
                e.type === 'RISK_ALERT_HIGH' || e.type === 'RISK_ALERT_CRITICAL'
            );
            assert.strictEqual(alerts.length, 0, 'No debe haber alertas');
        });
    });

    describe('NotificationObserver - Generación de Notificaciones', () => {
        let observer;

        beforeEach(() => {
            observer = new NotificationObserver();
        });

        it('✅ Debería crear notificación para RISK_ALERT_HIGH', () => {
            const event = {
                type: 'RISK_ALERT_HIGH',
                loanId: 201,
                borrowerId: 'borrower1',
                ltv: 92,
                severity: 'HIGH',
                alertMessage: 'LTV 92% - Riesgo alto'
            };

            observer.onRiskEvent(event);

            const history = observer.getNotificationHistory(1);
            assert.strictEqual(history.length, 1);
            assert.strictEqual(history[0].title.includes('Alerta'), true);
            assert.strictEqual(history[0].action, 'MAKE_PAYMENT');
        });

        it('✅ Debería crear notificación para RISK_ALERT_CRITICAL', () => {
            const event = {
                type: 'RISK_ALERT_CRITICAL',
                loanId: 202,
                borrowerId: 'borrower1',
                ltv: 97,
                severity: 'CRITICAL',
                alertMessage: 'LTV 97% - Liquidación inminente'
            };

            observer.onRiskEvent(event);

            const history = observer.getNotificationHistory(1);
            assert.strictEqual(history.length, 1);
            assert.strictEqual(history[0].title.includes('CRÍTICA'), true);
            assert.strictEqual(history[0].action, 'URGENT_PAYMENT');
        });

        it('✅ Debería filtrar notificaciones por ID de préstamo', () => {
            [201, 202, 201, 203].forEach(loanId => {
                observer.onRiskEvent({
                    type: 'RISK_ALERT_HIGH',
                    loanId,
                    borrowerId: 'borrower1',
                    ltv: 91,
                    severity: 'HIGH'
                });
            });

            const forLoan201 = observer.getNotificationsByLoan(201);
            assert.strictEqual(forLoan201.length, 2, 'Debe haber 2 notificaciones para préstamo 201');
        });
    });

    describe('LogObserver - Auditoría de Eventos', () => {
        let observer;

        beforeEach(() => {
            observer = new LogObserver();
        });

        it('✅ Debería registrar eventos en historial', () => {
            const events = [
                { type: 'RISK_EVALUATION', loanId: 301, ltv: 75, severity: 'INFO' },
                { type: 'RISK_ALERT_HIGH', loanId: 302, ltv: 91, severity: 'HIGH' },
                { type: 'RISK_ALERT_CRITICAL', loanId: 303, ltv: 96, severity: 'CRITICAL' }
            ];

            events.forEach(e => observer.onRiskEvent(e));

            const history = observer.getEventHistory();
            assert.strictEqual(history.length, 3, 'Debe haber 3 eventos');
        });

        it('✅ Debería filtrar eventos por tipo', () => {
            observer.onRiskEvent({ type: 'RISK_ALERT_HIGH', loanId: 401, severity: 'HIGH' });
            observer.onRiskEvent({ type: 'RISK_ALERT_CRITICAL', loanId: 402, severity: 'CRITICAL' });
            observer.onRiskEvent({ type: 'RISK_ALERT_HIGH', loanId: 403, severity: 'HIGH' });

            const alerts = observer.getEventsByType('RISK_ALERT_HIGH');
            assert.strictEqual(alerts.length, 2);
        });

        it('✅ Debería filtrar eventos por severidad', () => {
            [
                { type: 'RISK_ALERT_HIGH', severity: 'HIGH' },
                { type: 'RISK_ALERT_HIGH', severity: 'HIGH' },
                { type: 'RISK_ALERT_CRITICAL', severity: 'CRITICAL' }
            ].forEach((e, i) => {
                observer.onRiskEvent({ ...e, loanId: 500 + i });
            });

            const criticals = observer.getEventsBySeverity('CRITICAL');
            assert.strictEqual(criticals.length, 1);
        });

        it('✅ Debería generar estadísticas correctas', () => {
            const events = [
                { type: 'RISK_ALERT_HIGH', loanId: 601, severity: 'HIGH' },
                { type: 'RISK_ALERT_HIGH', loanId: 602, severity: 'HIGH' },
                { type: 'RISK_ALERT_CRITICAL', loanId: 602, severity: 'CRITICAL' }
            ];

            events.forEach(e => observer.onRiskEvent(e));

            const stats = observer.getStatistics();
            assert.strictEqual(stats.totalEvents, 3);
            assert.strictEqual(stats.byType['RISK_ALERT_HIGH'], 2);
            assert.strictEqual(stats.bySeverity['CRITICAL'], 1);
        });
    });

    describe('RiskMonitoringService - Integración Completa', () => {
        let service;

        beforeEach(() => {
            service = new RiskMonitoringService();
        });

        it('✅ Debería crear servicio con observers predeterminados', () => {
            const report = service.getRiskReport();
            assert.strictEqual(report.activeObservers, 2, 'Debe haber 2 observers (Notification + Log)');
        });

        it('✅ Debería generar reporte de riesgos', async () => {
            const loan = {
                id: 701,
                borrowerId: 'borrower1',
                lenderId: 'lender1',
                amount: 810,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await service.evaluateLoanRisk(loan, 3000);

            const report = service.getRiskReport(701);
            assert.ok(report.loanRiskStatus, 'Debe haber status de riesgo');
            assert.strictEqual(report.loanRiskStatus.ltv, 90);
        });

        it('✅ Debería registrar en auditoría', async () => {
            const loan = {
                id: 702,
                borrowerId: 'borrower1',
                lenderId: 'lender1',
                amount: 855,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await service.evaluateLoanRisk(loan, 3000);

            const auditLog = service.getAuditLog(702);
            assert.ok(auditLog.length > 0, 'Debe haber eventos en auditoría');
        });
    });
    
    describe('Criterios de Aceptación Gherkin - HU-08', () => {
        let service;

        beforeEach(() => {
            service = new RiskMonitoringService();
            service.clearForTesting();
        });

        it('Given caída de precio del colateral, When LTV=90%, Then monitorear dispara alert RIESGO_ALTO', async () => {
            const loan = {
                id: 800,
                borrowerId: 'borrower1',
                lenderId: 'lender1',
                amount: 810,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await service.evaluateLoanRisk(loan, 3000);

            const auditLog = service.getAuditLog(800);
            const alerts = auditLog.filter(e => e.type === 'RISK_ALERT_HIGH');
            assert.strictEqual(alerts.length, 1, 'Debe disparar RIESGO_ALTO');
        });

        it('Given caída crítica del colateral, When LTV=95%, Then monitorear dispara alert LIQUIDACION_INMINENTE', async () => {
            const loan = {
                id: 801,
                borrowerId: 'borrower1',
                lenderId: 'lender1',
                amount: 855,
                collateralType: 'ETH',
                collateralAmount: 0.3
            };

            await service.evaluateLoanRisk(loan, 3000);

            const auditLog = service.getAuditLog(801);
            const alerts = auditLog.filter(e => e.type === 'RISK_ALERT_CRITICAL');
            assert.strictEqual(alerts.length, 1, 'Debe disparar LIQUIDACION_INMINENTE');
        });
    });
});

module.exports = {
    MonitorRiesgo,
    NotificationObserver,
    LogObserver,
    RiskMonitoringService
};
