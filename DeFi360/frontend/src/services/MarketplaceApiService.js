import { marketplaceService } from "./api";
import { IMarketplaceService } from "./interfaces/IMarketplaceService";

export class MarketplaceApiService extends IMarketplaceService {
  async getOffers(filters) {
    const data = await marketplaceService.getOffers(filters);
    return data.offers;
  }

  async createOffer(data) {
    return await marketplaceService.createOffer(data);
  }

  async cancelOffer(id) {
    return await marketplaceService.cancelOffer(id);
  }
}