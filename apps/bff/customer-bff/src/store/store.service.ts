import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class StoreService {
  private gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000/api/v1';

  async getHomeFeed() {
    try {
      const response = await axios.get(`${this.gatewayUrl}/products`);
      return {
        featuredProducts: response.data,
        banners: [
          { id: '1', title: 'Summer Sale 50% Off', imageUrl: '/assets/banner-1.jpg' }
        ],
      };
    } catch (err) {
      return { featuredProducts: [], banners: [] };
    }
  }
}
