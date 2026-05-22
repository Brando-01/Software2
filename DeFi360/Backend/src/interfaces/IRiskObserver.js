class IRiskObserver {
    onRiskEvent(event) {
        throw new Error('Método onRiskEvent() debe ser implementado');
    }
}
module.exports = IRiskObserver;