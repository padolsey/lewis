import ChunkedConcurrentGPTRequest from '../ChunkedConcurrentGPTRequest.mjs';
import Logger from '../logger.mjs';

const logger = new Logger('BillDeltaFunctions');

// This query is just a test of the magical gpt function-calling api 
// (Conclusion : I'm not super impressed)

const IMPACTS = [
  'SEMANTIC',
  'MINOR',
  'MODERATE',
  'HIGH',
  'RESHAPING'
];

const FLAGS = [
  'RED',
  'YELLOW',
  'WHITE',
  'BLUE',
  'GREEN'
];

const PILLARS = [
  'National Security',
  'Social Welfare',
  'Economy',
  'Political Power',
  'Governance',
  'Public Health',
  'Education',
  'Human Rights',
  'Justice System',
  'Cultural Heritage',
  'Gender and Sexuality',
  'Race and Ethnicity',
  'Disability',
  'Minority Groups',
  'Democracy',
  'Scientific Research',
  'Technology',
  'Infrastructure',
  'Media and Information',
  'Religion and Spirituality',
  'Agriculture and Food Security',
  'Labor and Employment',
  'Immigration',
  'Foreign Relations',
  'Energy',
  'Arts and Entertainment',
  'Housing',
  'Transportation',
  'Financial Services and Regulation',
  'National Defence',
  'Trade',
  'Taxation',
  'Pensions and Aging Society',
  'Data Privacy and Cybersecurity',
  'Brexit-Related Issues',
  'Public Services',
  'Rural Affairs and Agriculture',
  'Urban Planning and Development',
  'Child and Family Services',
  'International Aid and Development',
  'Public Safety and Emergency Services',
  'Consumer Protection',
  'Maritime Affairs',
  'Tourism',
  'Sports and Recreation',
  'Veteran Affairs',
  'Mental Health'
];

export default class BillDeltaFunctionCallingExperiment extends ChunkedConcurrentGPTRequest {
  id = 'bill_delta_w_functions';
  chunkerTokenLimit = 6000;
  // chunkerTokenLimit = 3500;

  constructor(documentSpec) {
    super();
    this.documentSpec = documentSpec;
    console.log('bill_delta documentSpec', documentSpec);
  }

  genPayload(chunk) {
    return {

      // model: 'gpt-4',
      // max_tokens: 3000,

      model: 'gpt-3.5-turbo-16k',
      max_tokens: 7000,

      temperature: 0.0,
      function_call: 'auto',

      functions: [

        {

          name: 'escalateChanges',
          description: 'Process a set of changes encountered within the subset of the Parliamentary Bill',
          parameters: {
            type: 'object',
            properties: {
              changes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {

                    subject: {
                      type: 'string',
                      description: 'Maximally specific section, subsection or paragraph of where the change occurs'
                    },

                    type: {
                      type: 'string',
                      description: 'The type of change',
                      enum: ['insertion', 'amendment', 'ommission', 'other']
                    },

                    quote: {
                      type: 'string',
                      description: 'The relevant quote from the bill that allude to the change'
                      // items: {
                      //   type: 'string', description: 'a quote' }
                    },

                    summary: {
                      type: 'string',
                      description: 'A summary of the change, in plain English, for mainstream audience'
                    },

                    impact: {
                      type: 'string',
                      description: 'The assumed impact of the change',
                      enum: IMPACTS
                    },

                    affectedPillars: {
                      type: 'array',
                      description: 'Pillars of society affected by the change',
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                            description: 'Name of the pillar of society significantly affected by the proposed legislation',
                            enum: PILLARS
                          },
                          reason: {
                            type: 'string',
                            description: 'Description of how the proposed change have significant effect on this pillar'
                          }
                        }
                      }
                    }
                  },
                  // required: ['subject', 'type', 'summary']
                }
              }
            }
          },
          
        }

      ],

      messages: [
        { role: 'system', content: `

The text you're provided with is just a subset of a larger document, in this case a UK Bill that modifies an Act (legislation). Here is a summary of the entire bill:

-----
Title: ${this.documentSpec.title}
"${this.documentSpec.description}"
-----

You will only receive a small chunk of the bill at any one time. So, from this limited text, and ONLY THE TEXT, you identify ALL identifiable CHANGES within the text itself. Do not presume to know what exists outside of the text you're given.

Changes of HIGH relevance that you MUST record with priority:

- Establishment of new institutions, committees, entities, governmental bodies.
- Repeal or amendment of existing laws
- New regulations or regulatory frameworks
- New powers granted to the government
- New reporting/oversight mechanisms
- Budgetary/funding allocation
- Changes to bureaucratic processes 
- Expansion/restriction of individual rights
- Criminalization/decriminalization
- Territorial governance changes 

Output details about the changes you encounter by calling the escalateChanges function.

Here are additional instructions that will help you understand what to provide the escalateChanges function:

type: what type of change is it? 

subject: precisely what is the subject of the change (what part of the 'act' is the bill modifiying?, e.g. "subsection 22"

quote: piece of the specific text that alludes to the change

summary: a summary of the proposed change

impact: degree of impact: assesses the noteworthiness and significance of the change. E.g. 'RESHAPING' would be changes that overhaul existing legal structures or concepts or introduce wide-ranging new legal mechanisms or institutions that change the fabric of society. 

pillars: any key societal pillars (e.g. Human Rights, Disability, Economy) that would be affected and reasoning around _how_ they might be affected.

flag: indicates the proposed change's aggregate effect on humanitarian and progressive ideals such as an increase in human rights, social welfare, gender equality, etc.

For simplicity sake, a flag of GREEN = Good, RED = Bad.

RED= Obviously negative effect (e.g. racial profiling)
YELLOW= Questionably negative effect (e.g. reduction in public scrutiny of government)
WHITE= Very little effect (e.g. semantic or unimportant change)
BLUE= Possible positive effect (e.g. higher budget for libraries)
GREEN= Obviously positive effect (e.g. more protections for minorities)


        `.trim() },
        { role: 'user', content: chunk },
        // { role: 'assistant', content: `<!--I found many noteworthy proposed changes:-->\n`}
      ]
    };
  }

  perChunkProcess(result, index) {
    // Process result here, e.g., parse JSON, extract specific data, etc.
    console.log('\n\n\n\n\n>>>>>>>');
    console.log('perChunkProcess', result);
    console.log('\n\n\n\n\n>>>>>>>');

    return result;
  }

  aggregatedProcess(results) {

    console.log('results', results);

    if (!results.length) {
      logger.error('Unexpected results length', results.length);
      return null;
    }

    return results.map((result, resultIndex) => {

      if (!result) return null;

      const functionCall = result.functionCalls?.[0];

      if (!functionCall || functionCall.name !== 'escalateChanges') {
        logger.error(
          'Unexpected function call or no function call',
          functionCall
        );
        return null;
      }

      try {
        return JSON.parse(
          functionCall.arguments
        );
      } catch(err) {
        logger.error('Error parsing JSON of escalateChanges\' argument', err, functionCall.argument);
        logger.log('Therefore returning null for resultIndex', resultIndex);
        return null;
      }

    }).filter(Boolean);


    // return results;
    // Aggregate results here, e.g., concatenate results, calculate statistics, etc.
    // return results.map(res => {
    //   return res.content;
    // }).join('\n')
  }
}
