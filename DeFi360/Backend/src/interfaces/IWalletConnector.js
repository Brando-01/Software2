/**
 * Interfaz para la conexión de wallet Web3
 * Abstrae la lógica de conexión, permitiendo diferentes implementaciones (real o mock)
 * SOLID: DIP (Dependency Inversion Principle)
 */
class IWalletConnector {
    /**
     * Conecta una wallet y valida su existencia
     * @param {string} walletAddress - Dirección de la wallet
     * @returns {Promise<Object>} Objeto con información de la wallet
     */
    async connect(walletAddress) {
        throw new Error('IWalletConnector.connect() debe ser implementado');
    }

    /**
     * Valida que una dirección de wallet sea válida
     * @param {string} walletAddress - Dirección a validar
     * @returns {Promise<boolean>} true si es válida
     */
    async isValidWallet(walletAddress) {
        throw new Error('IWalletConnector.isValidWallet() debe ser implementado');
    }

    /**
     * Verifica que no exista sesión duplicada
     * @param {string} walletAddress - Dirección a verificar
     * @returns {Promise<boolean>} true si ya existe una sesión activa
     */
    async hasDuplicateSession(walletAddress) {
        throw new Error('IWalletConnector.hasDuplicateSession() debe ser implementado');
    }
}

module.exports = IWalletConnector;
