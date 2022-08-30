import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import fs from 'fs';

jobQueue.processJobs(
  'addOrthogroup',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { fileName } = job.data;
    logger.log(`Add ${fileName} file.`);

    const lineReader = fs.createReadStream(fileName, 'utf8');

    const lineProcessor = new NewickProcessor();

    lineReader.on('data', async (data) => {
      try {
        lineProcessor.parse(data.toString());
      } catch (error) {
        logger.error(error);
        job.fail({ error });
        callback();
      }
    });

    lineReader.on('close', async () => {
      try {
        logger.log('File reading finished');
        lineProcessor.lastPairwise();
        job.done();
      } catch (error) {
        logger.error(error);
        job.fail({ error });
      }
      callback();
    });
  },
);
