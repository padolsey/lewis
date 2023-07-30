import { promises as fs } from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import {marked} from 'marked';

import Logger from './logger';
import getBillDataFromGovAPI from './getBillDataFromGovAPI';

const logger = new Logger('bills data methods');

export async function getBillList() {
  const docsDirectory = path.join(process.cwd(), 'bills');
  const docNames = await fs.readdir(docsDirectory);

  console.log(docNames);

  let bills = await Promise.all(docNames.map(n => getBillSimpleData(n)));
  bills = bills.filter(Boolean);

  // console.log('>>>>foobar', bills);

  return bills;
}

export async function getBill(directoryName) {

  if (
    /test__/.test(directoryName) &&
    process.env.NODE_ENV === 'production'
  ) {
    return null;
  }

  const id = directoryName.match(/\d+/)?.[0];

  if (!id) {
    throw new Error('getBill : id from directoryName is invalid : ' + directoryName);
  }

  const docsDirectory = path.join(process.cwd(), 'bills');
  const filePath = path.join(docsDirectory, directoryName);

  const stat = await fs.stat(filePath);

  if (stat.isDirectory()) {
    const billTxtFilePath = path.join(filePath, 'bill.txt');
    const billTxtFileContents = await fs.readFile(billTxtFilePath, 'utf8');

    const specFilePath = path.join(filePath, 'spec.json');
    const specFileContents = await fs.readFile(specFilePath, 'utf8');

    const claudeFilePath = path.join(filePath, 'claude.md');
    const claudeHtmlContents = await getHtmlFromMarkdownFile(claudeFilePath);

    const tldrFilePath = path.join(filePath, 'tldr.md');
    const tldrHtmlContents = await getHtmlFromMarkdownFile(tldrFilePath);

    const concernsFilePath = path.join(filePath, 'concerns.md');
    const concernsHtmlContents = await getHtmlFromMarkdownFile(concernsFilePath);

    let xmlFileContents, jsonFileContents;

    const xmlFilePath = path.join(filePath, 'questions', 'bill_delta.xml');
    const jsonFilePath = path.join(filePath, 'questions', 'bill_delta_w_functions.json');

    try {
      xmlFileContents = await fs.readFile(xmlFilePath, 'utf8');
    } catch (e) {}

    try {
      jsonFileContents = await fs.readFile(jsonFilePath, 'utf8');
    } catch (e) {}

    if (!xmlFileContents && !jsonFileContents) {
      throw new Error(
        'No XML _or_ JSON bill delta results found '
          + xmlFilePath + ', ' + jsonFilePath
      );
    }

    let changes = jsonFileContents
      ? await calculateChangesFromJSONFile(jsonFileContents, billTxtFileContents)
      : await calculateChanges(xmlFileContents, billTxtFileContents)

    let billGovData;

    console.time('billGovData');

    try {
      billGovData = await getBillDataFromGovAPI(id);
    } catch (error) {
      console.error(`Error fetching bill data from Gov API: ${id}`, error);
    }

    console.timeEnd('billGovData');

    console.log('changes', changes.length );

    const outputBillData = {
      id: id,
      raw: billTxtFileContents,
      apiData: billGovData || null,

      claude: claudeHtmlContents,
      tldr: tldrHtmlContents,
      concerns: concernsHtmlContents,

      changes,
      ...JSON.parse(specFileContents),
    };

    return outputBillData;

  } else {
    return null;
  }
}

export async function getBillSimpleData(directoryName) {
  const docsDirectory = path.join(process.cwd(), 'bills');
  const filePath = path.join(docsDirectory, directoryName);

  const stat = await fs.stat(filePath);

  if (stat.isDirectory()) {

    if (
      /test__/.test(directoryName) &&
      process.env.NODE_ENV === 'production'
    ) {
      return null;
    }
    
    const specFilePath = path.join(filePath, 'spec.json');
    const specFileContents = await fs.readFile(specFilePath, 'utf8');

    return {
      id: directoryName,
      ...JSON.parse(specFileContents),
    };
  } else {
    return null;
  }
}

async function calculateChangesFromJSONFile(jsonFileContents, billTxtFileContents) {
  let changes = null;

  const rawSearchable = billTxtFileContents.replace(/[^a-z]/gi, '_');

  try {
    changes = JSON.parse(jsonFileContents);
  } catch(e) {
    logger.error('Cannot parse JSON');
    return [];
  }

  return changes.map(cs=>cs.changes).flat().map(change => {
    console.log('<<<<change', change);
    return {

      type: change.type,
      subject: change.subject,
      summary: change.summary,
      impact: change.impact,
      quotes: [change.quote],
      flag: change.flag || null,

      locatedQuote: findIndexOfChangeFromQuotes(
        change.quote ? [change.quote] : [],
        rawSearchable
      ),

      pillars: change?.affectedPillars?.map(({name, reason}) => {
        return {
          name,
          analysis: reason
        }
      }) || []

    }
  });

  return [];

}

async function calculateChanges(xmlFileContents, billTxtFileContents) {
  let changes;

  try {
    const result = await xml2js.parseStringPromise(xmlFileContents);

    const rawSearchable = billTxtFileContents.replace(/[^a-z]/gi, '_');

    changes = result.all.change;

    changes = changes.map(c => {

      // console.log('<<PILLARS>>', Object.entries(c.pillars?.[0] || {}), '...', c.pillars);

      // console.log('<<pillars', c.pillars)
      return {
        type: c.type?.[0],
        subject: c.subject?.[0],
        quotes: c.quote || [],
        summary: c.summary?.[0],
        impact: c.impact?.[0],
        clarity: c.clarity?.[0],
        flag: c.flag?.[0],
        locatedQuote: findIndexOfChangeFromQuotes(
          c.quote || [],
          rawSearchable
        ),
        pillars: (c.pillars?.[0]?.pillar || [])
          .map((pillar) => {

            if (!pillar?.$?.type) {
              return null;
            }

            return {
              name: pillar.$.type,
              analysis: pillar._ || null
            };
          })
          .filter(Boolean),
        // pillars: Object.entries(c.pillars?.[0] || {})
        //   .map(([name, [fields]]) => {

        //     console.log('p', name, fields)

        //     if (!fields?.$?.type) {
        //       return null;
        //     }

        //     return {
        //       name: fields.$.type,
        //       analysis: fields._ || 'null?'
        //     };
        //   })
        //   .filter(Boolean)
      }
    }).filter(change => {
      console.log('change uuuu', change.impact, change.flag);

      if (!changes.length < 20) {
        // If there aren't a lot of changes, just show all.
        return true;
      }

      return !(change.impact < 3 && change.flag == 'WHITE');
    })
  } catch (error) {
    console.error(`Error parsing XML file: ${xmlFileContents.slice(0,40).trim()}`, error);
    changes = [];
  }

  return changes;
}

function findFirstMatchFromIncreasingSubsetOfQuote(quote, text) {
  quote = quote.replace(/^"|"$/g, '');

  let low = 0;
  let high = quote.length;
  let lastGoodIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const tempQuote = quote.slice(0, mid);
    const matches = text.split(tempQuote).length - 1;

    if (matches >= 1) {
      lastGoodIndex = text.indexOf(tempQuote);
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return lastGoodIndex;
}

function findIndexOfChangeFromQuotes(quotes, rawSearchableBill) {
  let index = -1;
  let foundQuote = null;
  quotes.find(quote => {
    foundQuote = quote;

    quote = quote.trim().replace(/^"|"$/g, '_').replace(/[^a-z]/ig, '_');

    index = findFirstMatchFromIncreasingSubsetOfQuote(
      quote,
      rawSearchableBill
    );

    return index > -1;
  });

  return {quote: foundQuote, index};
}

async function getHtmlFromMarkdownFile(filePath) {
  let markdownContents = null;
  let htmlContents = null;
  try {
    markdownContents = await fs.readFile(filePath, 'utf8');
    htmlContents = marked.parse(markdownContents);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
  }

  return htmlContents;
}