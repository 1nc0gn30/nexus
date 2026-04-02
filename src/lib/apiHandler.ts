import axios from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
}

class APIHandler {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 60000; // 1 minute cache
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 500; // 500ms rate limit

  async fetch(url: string): Promise<any> {
    const cacheKey = `proxy:${url}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }

    try {
      // Always use server proxy to avoid browser CORS/ETP variance across endpoints.
      const targetUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await axios.get(targetUrl);

      if (typeof response.data === 'string' && response.data.trimStart().toLowerCase().startsWith('<!doctype html')) {
        throw new Error('Proxy returned HTML instead of API data. Check /api/proxy deployment routing.');
      }
      
      this.lastRequestTime = Date.now();
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      
      return response.data;
    } catch (error: any) {
      console.error(`APIHandler Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const apiHandler = new APIHandler();
