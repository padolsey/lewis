import estimateTokenCount from './estimateTokenCount.mjs';

export default function splitIntoChunks(str, maxTokens) {
  const parts = [];

  // Calculate average token length for this text
  const totalTokens = estimateTokenCount(str);
  const avgTokenLength = str.length / totalTokens;

  console.log('Token Count>>', totalTokens);

  // Helper function to split string at the nearest delimiter
  function splitAtNearestDelimiter(s, index) {

    if (index > s.length) {
      return [s, ''];
    }
    const delimiters = ['.', '\n', ' '];
    for (const delimiter of delimiters) {
      const splitIndex = s.lastIndexOf(delimiter, index);
      if (splitIndex !== -1) {
        return [s.substring(0, splitIndex + 1), s.substring(splitIndex + 1)];
      }
    }
    return [s.substring(0, index), s.substring(index)];
  }

  let remainingStr = str;
  while (remainingStr.length > 0) {
    let chunkSize = Math.floor(maxTokens * avgTokenLength);  // start with a chunk size based on average token length
    while (chunkSize > 0) {
      const [chunk, rest] = splitAtNearestDelimiter(remainingStr, chunkSize);
      const estimatedTokens = estimateTokenCount(chunk);
      if (estimatedTokens <= maxTokens) {
        parts.push(chunk);
        remainingStr = rest;
        break;
      } else {
        // If the chunk is too big, reduce chunkSize and try again
        chunkSize = Math.floor(chunkSize * 0.9);  // reduce size by 10%
      }
    }
    if (chunkSize === 0) {
      throw new Error('Unable to split string into small enough chunks');
    }
  }

  return parts;
}
