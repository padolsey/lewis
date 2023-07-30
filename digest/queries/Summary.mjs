import ChunkedConcurrentGPTRequest from '../ChunkedConcurrentGPTRequest.mjs';

export default class SummaryQuery extends ChunkedConcurrentGPTRequest {
  id = 'summary';

  // This is just a demo subclass - not v useful for lewis atm.

  genPayload(chunk) {
    return {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are tasked with summarizing the following text.' },
        { role: 'user', content: chunk }
      ]
    };
  }

  perChunkProcess(result) {
    // Process result here, e.g., parse JSON, extract specific data, etc.
    return result;
  }

  aggregatedProcess(results) {
    // Aggregate results here, e.g., concatenate results, calculate statistics, etc.
    return results;
  }
}
