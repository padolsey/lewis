import natural from 'natural';
import {encode, decode} from 'gpt-3-encoder';

const wordTokenizer = new natural.TreebankWordTokenizer();

function naturalEstimateTokenCount(str) {
  return 0 | wordTokenizer.tokenize(str).length * 1.6; // heuristic
}

function gptEndodeEstimateTokenCount(str) {
  // Much more accurate
  return encode(str).length * 1.1; // margin of error
}

// Estimates token count for a string, usually so we can
// avoid going over the token limit when making a request
export default function estimateTokenCount(str) {
  return gptEndodeEstimateTokenCount( String(str) );
}
