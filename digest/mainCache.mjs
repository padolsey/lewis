import { Level } from 'level';
import { LRUCache as LRU } from 'lru-cache';
import Logger from './logger.mjs';

const logger = new Logger('mainCache');

class CacheDB {
  constructor() {
    this.db = new Level('./db');
    this.initialized = false;
    this.cache = new LRU({
      maxSize: 10000000, // 10 megabytes 
      sizeCalculation: val => val?.value?.length || 1,
      dispose: async function(key, n) {
        await this.db.del(key);
      }.bind(this)
    });
    this.init();
  }

  async init() {
    try {
      await this.db.open();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to open database:", error);
    }
  }

  async ensureInitialized() {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async get(key) {
    await this.ensureInitialized();

    let data = this.cache.get(key);

    logger.dev('lru get value', key, data?.length);

    if (!data) {
      try {
        data = await this.db.get(key); 
      } catch(e) {
        data = null;
      }

      logger.dev('Level DB [persistent] get value', key, data?.length);

      if (data) {
        data = JSON.parse(data); 
        this.cache.set(key, data);
      }
    }

    return data;
  }

  async del(key) {
    await this.ensureInitialized();
    await this.db.del(key);
    this.cache.delete(key);
  }

  async set(key, value) {
    await this.ensureInitialized();

    if (!value) {
      logger.error('mainCache#set being used w/o value key:', key);
      return;
    }

    logger.dev('Committing to cache', key, 'json of length:', JSON.stringify(value).length);

    const data = {
      value: value,
      time: Date.now(),
    };

    this.cache.set(key, data);

    await this.db.put(key, JSON.stringify(data));
  }
}

const cacheDB = new CacheDB();

// Purge entries from LevelDB that are older than 5 days
const OLD_TIME_PERIOD = 1000 * 60 * 60 * 24 * 5;

async function purgeOldEntries() {
  await cacheDB.ensureInitialized();
  try {
    for await (const [key, value] of cacheDB.db.iterator()) {
      const data = JSON.parse(value);
      if (Date.now() - data.time > OLD_TIME_PERIOD) {
        logger.dev('LevelDB Purging Old:', key);
        await cacheDB.db.del(key);
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

// Run purgeOldEntries every fifteen minutes
setInterval(purgeOldEntries, 1000 * 60 * 15);

export async function get(k) {
  return cacheDB.get(k);
}
export async function set(k, v) {
  return cacheDB.set(k, v);
}
export async function del(k) {
  return cacheDB.del(k);
}