import PQueue from 'p-queue';
import splitIntoChunks from './splitIntoChunks.mjs';
import gpt from './OpenAIRequest.mjs';

const TOKEN_LIMIT = 3400;

export default class ChunkedConcurrentGPTRequest {

  constructor(genPayload) {
    this.defaultPayload = {
      model: 'gpt-3.5-turbo',
      max_tokens: 500
    };
    this.genPayload = genPayload || this.genPayload;
    this.queue = new PQueue({ concurrency: 8, interval: 1000 }); 
    this.results = [];
    this.chunks = [];
  }

  genPayload(chunk) {
    throw new Error('Subclass needs to override; or provide a callback to constructor');
  }

  perChunkProcess(result) {
    // Default chunk processing. Can be overridden by subclasses.
    return result;
  }

  aggregatedProcess(results) {
    // Default results aggregation. Can be overridden by subclasses.
    return results;
  }

  async processChunk(chunk, index, ...args) {

    console.log('Chunk #', index);

    const payload = await this.genPayload(chunk, ...args);
    console.log('Chunk #', index, ': finished generating payload');

    const result = await gpt({...this.defaultPayload, ...payload});

    console.log('Chunk #', index, ': finished request', 'got result of length', result?.usage, result?.content?.length);

    this.results[index] = this.perChunkProcess(result, index);
  }

  async make(text, ...args) {
    console.log('>>>', 'chunkerTokenLimit', this.chunkerTokenLimit);
    this.chunks = splitIntoChunks(text, this.chunkerTokenLimit || TOKEN_LIMIT);
    this.results = Array(this.chunks.length);

    console.log('ChunkedConcurrentGPTRequest chunk count', this.chunks.length);

    // pretend we just have one chunk.
    // console.log('TESTING WITH JUST a few chunks...');

    // if (true) {
    //   console.log('Chunker Warning: test mode!!! [slicing subset only]');
    //   this.chunks = this.chunks.slice(4, 5);

    //   console.log('Chunks>>>>>', this.chunks);
    // }

    this.chunks.forEach((chunk, index) => {
      this.queue.add(() => this.processChunk(chunk, index, ...args));
    });

    return this.queue.onIdle().then(() => this.aggregatedProcess(this.results));
  }

}
