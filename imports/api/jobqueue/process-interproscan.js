import ParseGff3File from '/imports/api/genes/parseGff3Interproscan.js';
import ParseTsvFile from '/imports/api/genes/parseTsvInterproscan.js';
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import readline from 'readline';
import fs from 'fs';

jobQueue.processJobs(
  'addInterproscan',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { fileName, parser } = job.data;
    logger.log(`Add ${fileName} interproscan file.`);

    const rl = readline.createInterface({
      input: fs.createReadStream(fileName, 'utf8'),
      crlfDelay: Infinity,
    });

    let lineProcessor;
    switch (parser) {
      case 'tsv':
        logger.log('Format : .tsv');
        lineProcessor = new ParseTsvFile();
        break;
      case 'gff3':
        logger.log('Format : .gff3');
        lineProcessor = new ParseGff3File();
        break;
    }

    let lineNbr = 0;

    rl.on('line', async (line) => {
      lineNbr += 1;

      if (lineNbr % 10000 === 0) {
        logger.debug(`Processed ${lineNbr} lines`);
      }

      try {
        lineProcessor.parse(line);
      } catch (err) {
        logger.error(err);
        job.fail({ err });
        callback();
      }
    });

    // Occurs when all lines are read.
    rl.on('close', async () => {
      try {
        logger.log('File reading finished');
        const { nMatched } = await lineProcessor.finalize();
        const nInserted = nMatched;
        logger.log(`Matched to ${nMatched} protein domain(s)`);
        job.done({ nInserted });
      } catch (err) {
        logger.error(err);
        job.fail({ err });
      }
      callback();
    });
  },
);
