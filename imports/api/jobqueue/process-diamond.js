import DiamondXmlProcessor from '/imports/api/genes/diamond/parseXmlDiamond.js';
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import readline from 'readline';
import XmlFlow from 'xml-flow';
import fs from 'fs';

jobQueue.processJobs(
  'addDiamond',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { fileName, parser } = job.data;
    logger.log(`Add ${fileName} diamond file.`);

    // A different parser for the xml file.
    if (parser === 'xml') {
      const stream = fs.createReadStream(fileName);
      const xml = new XmlFlow(stream);
      const lineProcessor = new DiamondXmlProcessor();
      const tag = 'blastoutput';

      xml.on(`tag:${tag}`, async (obj) => {
        try {
          lineProcessor.parse(obj);
        } catch (err) {
          logger.error(err);
          job.fail({ err });
          callback();
        }
      });

      xml.on('end', async () => {
        logger.log('Xml file reading finished !');
        job.done();
        callback();
      });

      xml.on('error', async (error) => {
        logger.error(error);
        job.fail({ error });
        callback();
      });
    } else {
      const rl = readline.createInterface({
        input: fs.createReadStream(fileName, 'utf8'),
        crlfDelay: Infinity,
      });

      const { size: fileSize } = await fs.promises.stat(fileName);

      rl.on('line', async (line) => {
        try {
          logger.log(line);
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
          job.done();
        } catch (err) {
          logger.error(err);
          job.fail({ err });
        }
        callback();
      });
    }
  },
);
