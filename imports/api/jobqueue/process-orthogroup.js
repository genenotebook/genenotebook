import NewickProcessor from '/imports/api/genes/orthogroup/parser/treeNewickParser.js';
import OrthoFinderPrefix from '/imports/api/genes/orthogroup/prefix/orthoFinderPrefix.js';
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';

jobQueue.processJobs(
  'addOrthogroup',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { folderName, prefixes } = job.data;

    const orthofinder = new OrthoFinderPrefix(prefixes);
    const newickProcessor = new NewickProcessor();

    const listprefixes = (typeof prefixes !== 'undefined' ? await orthofinder.getListPrefixes() : null);

    logger.log(`Add ${folderName} folder.`);
    logger.log('List prefixes :', listprefixes);

    // Iterate over all files in the folder.
    orthofinder.globListFilesFolder(folderName)
      .then(async (fileNames) => {
        const results = await Promise.all(
          fileNames.map(
            async (file) => newickProcessor.parse(file, listprefixes),
          ),
        );
      })
      .catch((error) => job.fail({ error }))
      .then(() => {
        const nOrthogroups = newickProcessor.getNumberOrthogroups();
        logger.log(`Inserted ${nOrthogroups} orthogroups`);
        job.done({ nInserted: nOrthogroups });
      });
    callback();
  },
);
