import fs from 'fs';
import path from 'path';
import BillDeltaQuery from './queries/BillDelta.mjs';
import BillDeltaFunctionCallingExperiment from './queries/BillDeltaFunctionCallingExperiment.mjs';
import SummaryQuery from './queries/Summary.mjs';

const queries = [
  // BillDeltaFunctionCallingExperiment,
  BillDeltaQuery,
  // SummaryQuery
];

fs.readdirSync(path.join(process.cwd(), 'bills/')).forEach((dir, i) => {
  if (!dir.startsWith('.') && !dir.startsWith('_')) {
    console.log(`\nProcessing bill directory ${i + 1}: ${dir}`);

    const billPath = path.join('bills', dir, 'bill.txt');
    const billText = fs.readFileSync(billPath, 'utf8');
    const specPath = path.join('bills', dir, 'spec.json');

    const questionsDirExists = fs.existsSync(
      path.join(process.cwd(), 'bills', dir, 'questions')
    );

    if (/test__/.test(dir)) return;

    if (/*!/test__/.test(dir) && */questionsDirExists) {
      console.log('Already done: ', dir);
      return;
    }

    // If it's a "test__" dir let's run the queries every time.
    // Useful for testing, obviously.

    let specJSON;
    try {
      specJSON = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    } catch (e) {
      console.error('Spec JSON not found or errored for bill', dir);
      console.error(e);
      return;
    }

    queries.forEach(Query => {
      const query = new Query(specJSON);

      console.log(`\nStarting ${query.id} query for bill: ${dir}`);

      query.make(billText)
        .then(result => {

          const outputDir = path.join(process.cwd(), 'bills', dir, 'questions');

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
          }

          const outputPath = path.join(outputDir, `${query.id}.xml`);
          // fs.writeFileSync(outputPath, JSON.stringify(result), 'utf-8');

          fs.writeFileSync(outputPath, '<all>' + result + '</all>', 'utf-8');
          console.log(`\nFinished ${query.id} query for bill: ${dir}. Results saved to ${outputPath}`);

        })
        .catch(error => {
          console.error(`\nError processing ${query.id} query for bill: ${dir}`, error);
        });
    });
  }
});
