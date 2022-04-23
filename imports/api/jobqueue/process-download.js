import jobQueue from './jobqueue.js';

import fs from 'fs';
import zlib from 'zlib';

import { getGeneSequences } from '/imports/api/util/util.js';
import logger from '/imports/api/util/logger.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import {
  Transcriptomes,
  ExperimentInfo,
} from '/imports/api/transcriptomes/transcriptome_collection.js';

const FORMATS = {
  Annotations: 'gff3',
  Sequences: 'fasta',
  Expression: 'tsv',
};

function formatAttributes(attributes) {
  return Object.entries(attributes)
    .map(([k, v]) => `${k}=${v}`)
    .join(';');
}

function formatGff3({ gene, options }) {
  // Options contains the attribute keys to include
  const {
    seqid,
    source,
    start: geneStart,
    end: geneEnd,
    score: geneScore,
    strand,
    attributes: geneAttributes,
    subfeatures,
  } = gene;

  const gffLines = subfeatures.map(
    ({
      type: subType,
      start: subStart,
      end: subEnd,
      score: subScore,
      phase: subPhase,
      attributes: subAttributes,
      parents,
    }) => {
      // eslint-disable-next-line no-param-reassign
      subAttributes.Parent = parents;
      const subAttributeString = formatAttributes(subAttributes);
      return `${seqid}\t${source}\t${subType}\t${subStart}\t${subEnd}\t${subScore}\t${strand}\t${subPhase}\t${subAttributeString}`;
    },
  );

  const geneAttributeString = formatAttributes(geneAttributes);
  const geneLine = `${seqid}\t${source}\tgene\t${geneStart}\t${geneEnd}\t${geneScore}\t${strand}\t-\t${geneAttributeString}`;
  gffLines.unshift(geneLine);

  return gffLines.join('\n');
}

function formatTsv({ gene, options }) {
  // Options contains the transcriptome samples to include
  const { ID: geneId } = gene;
  const { selectedSamples } = options;
  const line = selectedSamples.map((replicaGroup) => ExperimentInfo.find({ replicaGroup })
    .fetch()
    .map(({ _id }) => _id)
    .sort()
    .map((experimentId) => {
      const { tpm = 'NA' } = Transcriptomes.findOne({
        geneId,
        experimentId,
      }) || {};
      return tpm;
    })
    .join('\t'));

  line.unshift(geneId);
  line.push('\n');

  return line.join('\t');
}

function formatFasta({ gene, options }) {
  const { seqType, primaryTranscriptOnly } = options;
  const sequences = getGeneSequences(gene).sort((a, b) => b.nucl.length - a.nucl.length);

  const slice = primaryTranscriptOnly ? 1 : sequences.length;
  const fastaArray = sequences.slice(0, slice).map((seq) => {
    const seqString = seq[seqType].match(/.{1,80}/g).join('\n');
    return `>${seq.ID}\n${seqString}`;
  });
  return fastaArray.join('\n');
}

function formatGene({ gene, format, options }) {
  switch (format) {
    case 'gff3':
      return formatGff3({ gene, options });
    case 'fasta':
      return formatFasta({ gene, options });
    case 'tsv':
      return formatTsv({ gene, options });
    default:
      return gene.ID;
  }
}

function formatHeader({ format, options }) {
  switch (format) {
    case 'gff3':
      return '##gff-version 3\n';
    case 'fasta':
      return null;
    case 'tsv':
      return `gene_id\t${options.selectedSamples.join('\t')}\n`;
    default:
      return null;
  }
}

function processDownload(job, callback) {
  // logger.debug(job.data);
  const {
    queryHash, queryString, dataType, options,
  } = job.data;
  const query = JSON.parse(queryString);
  const format = FORMATS[dataType];

  const fileName = `GeneNoteBook_download_${queryHash}.${format}.gz`;

  logger.log(`Preparing ${fileName} for download`);

  const writeStream = fs.createWriteStream(fileName);
  const compress = zlib.createGzip();
  compress.pipe(writeStream);

  // the finish event is emitted when all data has been flushed from the stream
  compress.on('finish', async () => {
    logger.log('wrote all data to file');
    job.done(fileName);
    callback();
  });

  const querySize = Genes.find(query).count();
  const stepSize = Math.round(querySize / 10);

  const header = formatHeader({ format, options });
  if (header) compress.write(header);

  Genes.find(query).forEach((gene, index) => {
    if (index % stepSize === 0) {
      job.progress(index, querySize, { echo: true });
    }
    const lines = formatGene({ gene, format, options });
    compress.write(`${lines}\n`);
  });

  // close the stream
  compress.end();
}

const options = {
  concurrency: 1,
  payload: 1,
};

jobQueue.processJobs('download', options, processDownload);
