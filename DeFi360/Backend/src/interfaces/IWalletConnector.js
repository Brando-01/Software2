
class IWalletConnector {

    async connect(walletAddress) {
        throw new Error('IWalletConnector.connect() debe ser implementado');
    }


    async isValidWallet(walletAddress) {
        throw new Error('IWalletConnector.isValidWallet() debe ser implementado');
    }


    async hasDuplicateSession(walletAddress) {
        throw new Error('IWalletConnector.hasDuplicateSession() debe ser implementado');
    }
}

module.exports = IWalletConnector;
