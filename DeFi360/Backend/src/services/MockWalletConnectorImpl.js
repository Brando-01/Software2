
const IWalletConnector = require('../interfaces/IWalletConnector');

class MockWalletConnectorImpl extends IWalletConnector {
    constructor() {
        super();

        this.activeSessions = new Map();
    }


    async connect(walletAddress) {

        if (!await this.isValidWallet(walletAddress)) {
            throw new Error('Dirección de wallet inválida');
        }


        if (await this.hasDuplicateSession(walletAddress)) {
            throw new Error('Ya existe una sesión activa para esta wallet');
        }


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


    async isValidWallet(walletAddress) {

        const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethereumAddressRegex.test(walletAddress);
    }


    async hasDuplicateSession(walletAddress) {
        const session = this.activeSessions.get(walletAddress);
        return session && session.isActive;
    }


    async disconnect(walletAddress) {
        if (this.activeSessions.has(walletAddress)) {
            this.activeSessions.delete(walletAddress);
            return { success: true, message: 'Sesión cerrada' };
        }
        return { success: false, message: 'No hay sesión activa' };
    }


    clearAllSessions() {
        this.activeSessions.clear();
    }
}

module.exports = MockWalletConnectorImpl;
