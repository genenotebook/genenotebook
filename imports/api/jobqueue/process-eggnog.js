import { EggnogProcessor } from '/imports/api/genes/eggnog/addEggnog.js';
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import readline from 'readline';
import fs from 'fs';

jobQueue.processJobs(
  'addEggnog',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { fileName } = job.data;
    logger.log(`Add ${fileName} eggnog file.`);

    const lineProcessor = new EggnogProcessor();

    const rl = readline.createInterface({
      input: fs.createReadStream(fileName, 'utf8'),
      crlfDelay: Infinity,
    });

    const { size: fileSize } = await fs.promises.stat(fileName);
    let processedBytes = 0;
    let processedLines = 0;

    rl.on('line', async (line) => {
      processedBytes += line.length + 1; // also count \n
      processedLines += 1;
      if ((processedLines % 100) === 0) {
        await job.progress(processedBytes, fileSize, { echo: true },
          (err) => { if (err) logger.error(err); });
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
        logger.log(`Matched to ${nMatched} gene(s).`);
        job.done({ nInserted });
      } catch (err) {
        logger.error(err);
        job.fail({ err });
      }
      callback();
    });
  },
);
