import DiamondXmlProcessor from '/imports/api/genes/diamond/parser/parseXmlDiamond.js';
import DiamondPairwiseProcessor from '/imports/api/genes/diamond/parser/parseTxtDiamond.js';
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
    const { fileName, parser, program, matrix, database } = job.data;
    logger.log(`Add ${fileName} diamond file.`);

    // Different parser for the xml file.
    if (parser === 'xml') {
      const stream = fs.createReadStream(fileName);
      const xml = new XmlFlow(stream, { normalize: false });
      const lineProcessor = new DiamondXmlProcessor(program, matrix, database);
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
    } else if (parser === 'txt') {
      logger.log('Blast pairwise parse on Diamond.');

      const lineReader = readline.createInterface({
        input: fs.createReadStream(fileName, 'utf8'),
      });

      const lineProcessor = new DiamondPairwiseProcessor();

      lineReader.on('line', async (line) => {
        try {
          lineProcessor.parse(line);
        } catch (error) {
          logger.error(error);
          job.fail({ error });
          callback();
        }
      });

      lineReader.on('close', async () => {
        try {
          logger.log('File reading finished, start bulk insert');
          lineProcessor.lastPairwise();
          job.done();
        } catch (error) {
          logger.error(error);
          job.fail({ error });
        }
        callback();
      });
    }
  },
);
