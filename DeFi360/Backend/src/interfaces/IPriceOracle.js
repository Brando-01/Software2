/**
 * Interfaz IPriceOracle para obtener precios de activos
 * Abstrae la fuente de precios (oracle real, simulado, etc.)
 * SOLID: DIP - Los componentes dependen de esta abstracción, no de oracle.service directo
 */
class IPriceOracle {
    /**
     * Obtiene el precio de un activo
     * @param {string} symbol - Símbolo del activo (ej: "ETH", "BTC", "USDC")
     * @returns {Promise<number>} Precio del activo
     */
    async getPrice(symbol) {
        throw new Error('IPriceOracle.getPrice() debe ser implementado');
    }

    /**
     * Obtiene precios de múltiples activos
     * @param {string[]} symbols - Lista de símbolos
     * @returns {Promise<Object>} Mapa de símbolo -> precio
     */
    async getPrices(symbols) {
        throw new Error('IPriceOracle.getPrices() debe ser implementado');
    }

    /**
     * Valida si un símbolo es soportado
     * @param {string} symbol - Símbolo a validar
     * @returns {Promise<boolean>} true si es válido
     */
    async isSymbolSupported(symbol) {
        throw new Error('IPriceOracle.isSymbolSupported() debe ser implementado');
    }
}

module.exports = IPriceOracle;
