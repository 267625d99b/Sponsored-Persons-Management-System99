// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute default

const cacheMiddleware = (ttl = CACHE_TTL) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const tenantKey = req.tenantId || (req.isSuperAdmin ? `superadmin:${req.admin?.id}` : 'public');
    const key = `${tenantKey}:${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Clear cache on data mutations - يتم تنفيذه قبل الـ response
const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => clearCache(pattern));
      }
    });
    next();
  };
};

module.exports = { cacheMiddleware, clearCache, invalidateCache };
