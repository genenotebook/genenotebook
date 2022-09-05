import NewickProcessor from '/imports/api/genes/orthogroup/parser/treeNewickParser.js'
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import glob from 'glob';

jobQueue.processJobs(
  'addOrthogroup',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { folderName } = job.data;
    logger.log(`Add ${folderName} folder.`);

    /**
     * Asynchronously returns the name of each files present in the folder.
     * Use the {/*.txt} pattern from the glob package.
     * @function
     */
    const globListFilesFolder = (folder) => {
      return new Promise((resolve, reject) => {
        glob(`${folder}/*.txt`, (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        });
      });
    };

    const newickProcessor = new NewickProcessor('test');

    // Iterate over all files in the folder.
    globListFilesFolder(folderName)
      .then(async (fileNames) => {
        const results = await Promise.all(
          fileNames.map(
            async (file) => newickProcessor.parse(file),
          ),
        );
        // If no error commit all changes
        const nOrthogroups = results.length;

        // sum using reduce
        const nGenes = results.reduce((a, b) => a + b, 0);
      })
      .catch((error) => job.fail({ error }))
      .then(() => job.done());
  },
);
