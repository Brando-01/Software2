/**
 * MockWalletConnectorImpl: Implementación simulada de conexión de wallet
 * Usada para desarrollo, testing y ambientes simulados
 * SOLID: DIP (depende de abstracción IWalletConnector, no de implementación concreta)
 */
const IWalletConnector = require('../interfaces/IWalletConnector');

class MockWalletConnectorImpl extends IWalletConnector {
    constructor() {
        super();
        // Simulación de sesiones activas por wallet
        this.activeSessions = new Map();
    }

    /**
     * Conecta una wallet en modo simulado
     */
    async connect(walletAddress) {
        // Validar primero
        if (!await this.isValidWallet(walletAddress)) {
            throw new Error('Dirección de wallet inválida');
        }

        // Verificar sesión duplicada
        if (await this.hasDuplicateSession(walletAddress)) {
            throw new Error('Ya existe una sesión activa para esta wallet');
        }

        // Registrar sesión activa
        const sessionId = `session_${Date.now()}`;
        this.activeSessions.set(walletAddress, {
            sessionId,
            connectedAt: new Date(),
            isActive: true
        });

        return {
            success: true,
            walletAddress,
            sessionId,
            connectedAt: new Date(),
            message: 'Wallet conectada exitosamente (simulada)'
        };
    }

    /**
     * Valida el formato de dirección de wallet (simulado)
     */
    async isValidWallet(walletAddress) {
        // Validación básica: comienza con 0x, tiene 42 caracteres
        const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethereumAddressRegex.test(walletAddress);
    }

    /**
     * Verifica sesión duplicada
     */
    async hasDuplicateSession(walletAddress) {
        const session = this.activeSessions.get(walletAddress);
        return session && session.isActive;
    }

    /**
     * Desconecta una wallet (para limpiar sesiones)
     */
    async disconnect(walletAddress) {
        if (this.activeSessions.has(walletAddress)) {
            this.activeSessions.delete(walletAddress);
            return { success: true, message: 'Sesión cerrada' };
        }
        return { success: false, message: 'No hay sesión activa' };
    }

    /**
     * Limpia todas las sesiones (útil para tests)
     */
    clearAllSessions() {
        this.activeSessions.clear();
    }
}

module.exports = MockWalletConnectorImpl;
