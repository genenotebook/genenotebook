import DownloadDataConversion from '/imports/api/genes/download/convert/convertDownload.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import zlib from 'zlib';
import fs from 'fs';

const FORMATS = {
  Annotation: 'gff3',
  Sequence: 'fasta',
  Expression: 'tsv',
};

jobQueue.processJobs(
  'download',
  {
    concurrency: 1,
    payload: 1,
  },
  async (job, callback) => {
    /** Get all parameters from the validMethod. */
    const {
      queryHash, // Md5 Hash e.g. e38b9766ac6220047212e761f32577cef7320e9f.
      queryString, // Mongodb query e.g. {"ID":{"$in":["Ciclev10004109m.g.v1.0"]}}.
      dataType, // View selectionned e.g. Annotation, Sequence, Expression.
      options, // Some options e.g. { fileFormat: '.gff3', primaryTranscriptOnly: true }
    } = job.data;

    const downloadProcessor = new DownloadDataConversion();

    const query = JSON.parse(queryString);

    /** The type of conversion chosen (depends on the view of the download). */
    const format = FORMATS[dataType];

    const fileName = `GeneNoteBook_download_${queryHash}.${format}.gz`;
    logger.log(`Preparing ${fileName} for download`);

    const gzip = zlib.createGzip();
    gzip.pipe(fs.createWriteStream(fileName));

    gzip.on('error', async (err) => {
      logger.error('Job fail to download !', err);
      job.fail(err);
      callback();
    });

    gzip.on('finish', async () => {
      logger.log('Write stream is done');
      job.done(fileName);
      callback();
    });

    const querySize = Genes.find(query).count();
    const stepSize = Math.round(querySize / 10);

    /** Add header to the top of the file e.g. #gff3-version 3 ... */
    const header = downloadProcessor.getFormatHeader({ format, options });
    if (header) gzip.write(header);

    /** For each selected gene(s) write the information in the gzip. */
    const allGenes = await Genes.rawCollection().find(query).toArray();
    allGenes.forEach((gene, index) => {
      if (index % stepSize === 0) {
        job.progress(index, querySize, { echo: true });
      }

      /**
        * Depending on the type of conversion returns the set in the correct
        * format (gff3, fasta, tsv).
        */
      const lines = downloadProcessor.getConverter({ format, gene, options });
      gzip.write(`${lines}\n`);
    });

    gzip.end();
    logger.log('Compress gzip file sucess.');
  },
);
