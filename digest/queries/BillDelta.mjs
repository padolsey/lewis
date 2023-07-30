import ChunkedConcurrentGPTRequest from '../ChunkedConcurrentGPTRequest.mjs';

export default class BillDeltaQuery extends ChunkedConcurrentGPTRequest {
  id = 'bill_delta';
  // chunkerTokenLimit = 5500;
  chunkerTokenLimit = 2800;

  constructor(documentSpec) {
    super();
    this.documentSpec = documentSpec;
    console.log('bill_delta documentSpec', documentSpec);
  }

  genPayload(chunk) {
    return {
      // model: 'gpt-3.5-turbo-16k',
      // max_tokens: 9000,

      model: 'gpt-4',
      max_tokens: 3000,
      temperature: 0.0,
      messages: [
        { role: 'system', content: `

The text you're provided is just a subset of a larger document, in this case a UK Bill that modifies an Act (legislation). Here is a summary of the entire bill:

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
- Freedom limiting measures
- Technical or technological measures and regulations
- Digital privacy changes

For each identifiable change, you output:

<change>
   <type></type>
   <subject></subject>

   <!-- one or more quotes... -->
   <quote></quote>

   <summary></summary>
   <impact></impact>
   <clarity></clarity>

   <pillars>
     <pillar type="Gender and Sexuality"></pillar>
     <pillar type="Education"></pillar>
     <pillar type="Human Rights"></pillar>
     <!--... Etc. other relevant pillars go here...-->
   </pillars>
   <flag></flag>
</change>

Here's a more detailed structure:

<change>
   <!-- how did it change? what type of change -->
   <type>
    <!--
      valid values: insertion|amendment|deletion|substitution|repeal|renumber|reorder
    -->
   </type>

   <!-- Precisely what is the subject of the change (what part of the 'act' is the bill modifiying?) -->
   <subject>
     <!-- e.g. "subsection 22" -->
   </subject>

   <!-- relevant quotes that discuss the change (one or more) -->
   <quote>...</quote>
   <quote>...</quote>
   <quote>...</quote>

   <summary>
     <!-- a summary of the proposed change -->
   </summary>

   <impact>

     <!-- Valid values: 1|2|3|4|5|Unknown -->

     <!-- Explanation:
      "Impact" assesses the noteworthiness and significance of the change.

      Here are the different values' meanings:

      Unknown = Unintelligible or unclear.

      1 = Minor/Semantic: Changes are minor, non-substantive, or just rewordings without modifying legal or societal implications.

      2 = Moderate: Changes could potentially affect legal processes significantly, though not guaranteed or immediate.

      3 = High: Changes will certainly cause significant shifts in legal processes, affecting how laws are enforced, prosecuted, or defended.

      4 = Massive: Changes dramatically reshape the legal landscape, impacting major legal institutions, concepts, or established precedents. 

      5 = Revolutionary: Changes overhaul existing legal structures or concepts or introduce wide-ranging new legal mechanisms or institutions that change the fabric of society.
     -->

   </impact>

   <clarity>
     <!-- valid values: 1|2|3 -->
     <!--
      Explanation: "Clarity" measures the definition, precision, and ambiguity.

      1 = Low: The change is vague, ambiguous, and reliant on subsequent interpretations or regulations for application.

      2 = Medium: The change is relatively clear but leaves room for varied interpretations. May need court or regulatory interpretations for precise implementation.

      3 = High: The change is very clear and precise, written in straightforward language with little to no room for varied interpretations, implying straightforward implementation.
     -->
   </clarity>

   <pillars>

    <!--
     Analysis of the change as it pertains to key societal pillars.
    -->

     <pillar type="Gender and Sexuality">
      <!-- brief analysis IF APPLICABLE of any of the given pillar types... -->
     </pillar>

     <pillar type="Education">
      <!-- brief analysis here -->
     </pillar>

     <pillar type="Human Rights">
      <!-- brief analysis here -->
     </pillar>

     <!-- ... Etc. other relevant pillars go here... -->

     <!--
      These are some other pillar types:

      - National Security
      - Social Welfare
      - Economic Impact
      - Political Power
      - Public Health
      - Education
      - Human Rights
      - Justice System
      - Cultural Impact
      - Gender and Sexuality
      - Race and Ethnicity
      - Disability
      - Minority Groups
      - Freedom of Information
      - (...any others u see fit to add ...)
     -->
   </pillars>

   <flag>

     <!-- Valid values: RED|YELLOW|WHITE|BLUE|GREEN -->

     <!--
      This flag indicates the proposed change's aggregate effect on
      humanitarian and progressive ideals
      such as an increase in human rights, social welfare, gender equality, etc.

      For simplicity: Green = Good, Red = Bad. Purple = Subtle + possibly Insidious.

      RED= Obviously negative effect (e.g. racial profiling)
      YELLOW= Questionably negative effect (e.g. reduction in public scrutiny of government)
      WHITE= Very little effect (e.g. semantic or unimportant change)
      BLUE= Possible positive effect (e.g. higher budget for libraries)
      GREEN= Obviously positive effect (e.g. more protections for minorities)
     -->

   </flag>
</change>

${
  this.documentSpec.watchout
  ? 'With this bill especially you must keep an keen eye out for these types of changes:\n'
      + this.documentSpec.watchout
  : ''
}

        `.trim() },
        { role: 'user', content: chunk },
        { role: 'assistant', content: `<!--I found many noteworthy proposed changes:-->\n`}
      ]
    };
  }

  perChunkProcess(result, index) {

    console.log('RESULT>>>\n\n\n\n\n');
    console.log(result);
    console.log('\n\n\n\n\n<<<<<');

    if (!/<change>[\s\S]+<\/change>/.test(result.content)) {
      return null;
    }

    // Process result here, e.g., parse JSON, extract specific data, etc.

    if (result.content.match(/<\w+>/g).length !== result.content.match(/<\/\w+>/g).length) {
      console.error('Chunk #', index, 'Unmatched XML tags');
      console.log('Shortening by un-ideally throwing away everything beyond last </change>');

      return {
        ...result,
        content: result.content.match(/<change>[\s\S]*?<\/change>/gi).join('\n')
      }
    }

    return result;
  }

  aggregatedProcess(results) {
    // Aggregate results here, e.g., concatenate results, calculate statistics, etc.
    return results.filter(Boolean).map(res => {
      return res.content;
    }).join('\n')
  }
}
