// Import needed libraries
import fetch from 'node-fetch';
import {LRUCache as LRU} from 'lru-cache';
import PQueue from 'p-queue';

// Define and configure cache
const billDataCache = new LRU({
  max: 500,  // Define maximum cache size (in number of items)
  maxAge: 1000 * 60 * 30  // Define maximum age (in milliseconds)
});

// Define and configure the priority queue
const queue = new PQueue({concurrency: 2});

// Define the task to be done
const fetchBillData = async (bill_id) => {
  // Get data from API
  console.log('getBillData', `https://bills-api.parliament.uk/api/v1/Bills/${bill_id}`);

  const response = await fetch(`https://bills-api.parliament.uk/api/v1/Bills/${bill_id}`);

  const data = await response.json();

  // Store in cache
  const cacheKey = `bill_${bill_id}`;
  billDataCache.set(cacheKey, data);

  return data;
};

export default async function(bill_id) {
  const cacheKey = `bill_${bill_id}`;

  // Check cache first
  if (billDataCache.has(cacheKey)) {
    return billDataCache.get(cacheKey);
  }

  // If not in cache, fetch data
  // Add task to queue and wait for it to finish
  const data = await queue.add(() => fetchBillData(bill_id));
  return data;
}
