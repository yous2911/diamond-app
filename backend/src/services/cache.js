"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheServiceImpl = void 0;
class CacheServiceImpl {
    constructor(options) {
        this.options = options;
        this.memoryCache = new Map();
    }
    // FIXED: Line 31:50 - Replace any with generic type T
    async get(key) {
        const item = this.memoryCache.get(key);
        if (!item) {
            return null;
        }
        if (Date.now() > item.expiry) {
            this.memoryCache.delete(key);
            return null;
        }
        return item.value;
    }
    // FIXED: Line 47:26 - Replace any with generic type T
    async set(key, value, ttl) {
        const expiry = Date.now() + (ttl || this.options.ttl) * 1000;
        this.memoryCache.set(key, { value, expiry });
        // Clean up expired entries if cache is getting full
        if (this.memoryCache.size > this.options.max) {
            this.cleanup();
        }
    }
    async del(key) {
        this.memoryCache.delete(key);
    }
    async clear() {
        this.memoryCache.clear();
    }
    async has(key) {
        const item = this.memoryCache.get(key);
        if (!item)
            return false;
        if (Date.now() > item.expiry) {
            this.memoryCache.delete(key);
            return false;
        }
        return true;
    }
    async keys(pattern) {
        const allKeys = Array.from(this.memoryCache.keys());
        if (!pattern) {
            return allKeys;
        }
        // Simple pattern matching (can be improved with regex)
        return allKeys.filter(key => key.includes(pattern));
    }
    async ttl(key) {
        const item = this.memoryCache.get(key);
        if (!item)
            return -1;
        const remaining = item.expiry - Date.now();
        return remaining > 0 ? Math.floor(remaining / 1000) : -1;
    }
    async expire(key, seconds) {
        const item = this.memoryCache.get(key);
        if (item) {
            item.expiry = Date.now() + seconds * 1000;
        }
    }
    async ping() {
        return true;
    }
    async getStats() {
        return {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            memory: {
                used: this.memoryCache.size,
                total: -1, // Not applicable for memory cache
            },
        };
    }
    // FIXED: Line 95:33 - Replace any with proper cleanup logic
    cleanup() {
        const now = Date.now();
        const toDelete = [];
        this.memoryCache.forEach((item, key) => {
            if (now > item.expiry) {
                toDelete.push(key);
            }
        });
        toDelete.forEach(key => this.memoryCache.delete(key));
    }
}
exports.CacheServiceImpl = CacheServiceImpl;
