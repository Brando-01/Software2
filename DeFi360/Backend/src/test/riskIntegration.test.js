const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');
const IRiskObserver = require('../interfaces/IRiskObserver');
const assert = require('assert');

// =========================================================================
// 1. CONSTRUCCIÓN DEL MONITOR DE RIESGO (Sujeto del Patrón Observer)
// =========================================================================
class MonitorRiesgo {
    constructor(estrategiaRiesgo) {
        this.observers = [];
        this.estrategia = estrategiaRiesgo;
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    evaluarPrestamo(loan, collateralValue) {
        const resultado = this.estrategia.evaluate(loan.amount, collateralValue);

        // Mapeamos los flags del backend ('high' y 'critical') a las alertas del plan de negocio
        if (resultado.riskLevel === 'high' || resultado.riskLevel === 'critical') {
            const nivelAlerta = resultado.riskLevel === 'high' ? 'RIESGO_ALTO' : 'LIQUIDACION_INMINENTE';
            
            const eventoAlerta = {
                loanId: loan.id,
                amount: loan.amount,
                collateralValue: collateralValue,
                ltvRatio: resultado.ratio,
                nivel: nivelAlerta,
                message: resultado.message,
                timestamp: new Date()
            };

            this.notificarObservers(eventoAlerta);
        }
    }

    notificarObservers(evento) {
        this.observers.forEach(observer => {
            observer.onRiskEvent(evento);
        });
    }
}

// =========================================================================
// 2. SUITE DE VALIDACIÓN DE QA (Alineación con el Motor de Estrategia Real)
// =========================================================================
describe('T-16 / HU-08: Pruebas de Integración - Ciclo Observer + Strategy', () => {
    let monitor;
    let estrategiaLTV;
    let mockNotificationObserver;
    let mockLogObserver;

    beforeEach(() => {
        // Dejamos que la estrategia use sus umbrales nativos estables del repositorio (70 y 80)
        // para garantizar compatibilidad con las pruebas unitarias previas de la HU-08
        estrategiaLTV = new LTVRiskStrategy(); 
        monitor = new MonitorRiesgo(estrategiaLTV);

        class TestObserver extends IRiskObserver {
            constructor() {
                super();
                this.alertasRecibidas = [];
            }
            onRiskEvent(event) {
                this.alertasRecibidas.push(event);
            }
        }

        mockNotificationObserver = new TestObserver();
        mockLogObserver = new TestObserver();

        monitor.addObserver(mockNotificationObserver);
        monitor.addObserver(mockLogObserver);
    });

    test('Debería disparar alerta RIESGO_ALTO a todos los observadores cuando LTV supera el umbral alto (>70%)', () => {
        // Forzamos un LTV de 75% ((750 / 1000) * 100) para entrar limpiamente en el rango 'high' de la estrategia
        const loanMock = { id: 10, amount: 750.00 };
        const colateralPrecioCaido = 1000.00;

        monitor.evaluarPrestamo(loanMock, colateralPrecioCaido);

        assert.strictEqual(mockNotificationObserver.alertasRecibidas.length, 1);
        assert.strictEqual(mockNotificationObserver.alertasRecibidas[0].nivel, 'RIESGO_ALTO');
        assert.strictEqual(mockNotificationObserver.alertasRecibidas[0].loanId, 10);
        assert.strictEqual(mockNotificationObserver.alertasRecibidas[0].ltvRatio, '75.00');

        assert.strictEqual(mockLogObserver.alertasRecibidas.length, 1);
        assert.strictEqual(mockLogObserver.alertasRecibidas[0].nivel, 'RIESGO_ALTO');
    });

    test('Debería disparar alerta LIQUIDACION_INMINENTE cuando LTV supera el umbral crítico (>80%)', () => {
        // Forzamos un LTV de 85% ((850 / 1000) * 100) para entrar limpiamente en el rango 'critical' de la estrategia
        const loanMock = { id: 11, amount: 850.00 };
        const colateralPrecioCritico = 1000.00;

        monitor.evaluarPrestamo(loanMock, colateralPrecioCritico);

        assert.strictEqual(mockNotificationObserver.alertasRecibidas.length, 1);
        assert.strictEqual(mockNotificationObserver.alertasRecibidas[0].nivel, 'LIQUIDACION_INMINENTE');
        assert.strictEqual(mockNotificationObserver.alertasRecibidas[0].loanId, 11);
        assert.strictEqual(mockNotificationObserver.alertasRecibidas[0].ltvRatio, '85.00');

        assert.strictEqual(mockLogObserver.alertasRecibidas.length, 1);
        assert.strictEqual(mockLogObserver.alertasRecibidas[0].nivel, 'LIQUIDACION_INMINENTE');
    });

    test('No debería gatillar alertas a los observadores si el LTV se encuentra en rangos seguros', () => {
        // LTV de 40% ((400 / 1000) * 100), nivel 'low' seguro
        const loanMock = { id: 12, amount: 400.00 };
        const colateralEstable = 1000.00;

        monitor.evaluarPrestamo(loanMock, colateralEstable);

        assert.strictEqual(mockNotificationObserver.alertasRecibidas.length, 0);
        assert.strictEqual(mockLogObserver.alertasRecibidas.length, 0);
    });

    test('Debería arrojar un error controlado si el valor del colateral es menor o igual a cero', () => {
        const loanMock = { id: 13, amount: 500.00 };
        const colateralInvalido = 0;

        assert.throws(() => {
            monitor.evaluarPrestamo(loanMock, colateralInvalido);
        }, /El valor del colateral debe ser mayor a cero/);
    });
});