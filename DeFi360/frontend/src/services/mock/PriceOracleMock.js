import { IPriceOracle } from "../interfaces/IPriceOracle";

export class PriceOracleMock extends IPriceOracle {
    constructor(){
        super();

        this.mockPrices = {
            BTC: 65000,
            ETH: 3200,
            USDC: 1,
        };
    }

    async getAssetPrice(symbol){
        return this.mockPrices[symbol] || 0;
    }
}