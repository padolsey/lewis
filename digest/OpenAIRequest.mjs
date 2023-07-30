import { createParser } from "eventsource-parser";
import { createHash } from 'crypto';
import PQueue from 'p-queue';
import estimateTokenCount from './estimateTokenCount.mjs';
import 'dotenv/config';

import { get as getCache, set as setCache } from './mainCache.mjs';
import Logger from './logger.mjs';

const logger = new Logger('OpenAIRequest');

if (!/sk-/.test(process.env.OPENAI_API_KEY)) {
  throw new Error('No valid OpenAI API Key specified');
}

const PAYLOAD_DEFAULTS = {
  model: 'gpt-3.5-turbo',
  max_tokens: 1000,
  stop: null,
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

const queue = new PQueue({ concurrency: 3, interval: 1000 });
const ongoingRequests = new Map(); // Map for ongoing requests

export default async function OpenAIRequest(payload) {
  return queue.add(async () => {
    // console.log('\n\n\n\n\n\n\n');
    console.log('OpenAIRequest payload', JSON.stringify(payload));
    // console.log('\n\n\n\n\n\n\n');

    let hash = createHash('md5').update(JSON.stringify(payload)).digest('hex');

    let cachedData = await getCache(hash);
    if (cachedData) {
        logger.log('OpenAIRequest: cached', hash);
        // If data is in the cache, use it
        return cachedData.value;
    } 

    let ongoingRequest = ongoingRequests.get(hash);
    if (ongoingRequest) {
        logger.log('OpenAIRequest: ongoing', hash);
        // If the request is currently ongoing, wait for it to finish
        return ongoingRequest;
    }

    // Start a new request and store the Promise in ongoingRequests
    const requestPromise = makeRequest(hash, payload);
    ongoingRequests.set(hash, requestPromise);

    const result = await requestPromise;

    // Once the request is done, remove it from ongoingRequests
    ongoingRequests.delete(hash);

    return result;
  });
}

async function makeRequest(hash, payload) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({...PAYLOAD_DEFAULTS, ...payload}),
  }).catch(err => {
    logger.error('Fetch Error', err);
  });

  if (payload.stream) {
    throw new Error(
      'You are trying to stream. Use OpenAIStream instead of OpenAIRequest'
    );
  }

  if (!res || !res.ok) {
    logger.error('OpenAIRequest error1');

    let errorMessage;
    try {
      errorMessage = await res?.json();
      errorMessage = errorMessage?.message;
    } catch(e) {
      errorMessage = await res?.text();
      errorMessage ??= "Unknown error";
    }

    logger.error("Fetch Error: Non-successful status code", res.status, errorMessage);

    if (!errorMessage) {
      logger.error(res);
    }

    logger.error(
      'Payload Tokens:',
      payload.messages.map(m => estimateTokenCount(m.content)),
      'Max_Tokens:',
      payload.max_tokens
    );

    // if response alludes to "overloaded with other requests" then re-try in 10 seconds.
    if (errorMessage?.includes("overloaded with other requests")) {
      logger.log('Received "overloaded with other requests". Retrying in 30 seconds');
      await new Promise((resolve) => setTimeout(resolve, 30000));
      return makeRequest(hash, payload);
    }
  }

  let result;
  try {
    result = await res?.json();
  } catch(e) {
    console.error('>>BODY OF RESULT NO WORKING???', e);
    return null;
  }

  const aiContentReply = result?.choices?.[0]?.message?.content;

  const aiFunctionCallsReplies = result?.choices?.map(c => {
    if (c.message.function_call) {
      return c.message.function_call;
    } else {
      return null;
    }
  }).filter(Boolean);

  // Save to cache
  setCache(hash, {
    content: aiContentReply,
    functionCalls: aiFunctionCallsReplies,
    usage: result.usage
  });

  return {
    content: aiContentReply,
    functionCalls: aiFunctionCallsReplies,
    usage: result.usage
  };
}
