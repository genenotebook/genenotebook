import NewickProcessor from '/imports/api/genes/orthogroup/parser/treeNewickParser.js'
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
import glob from 'glob';

import fs from 'fs';
import path from 'path';

jobQueue.processJobs(
  'addOrthogroup',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { folderName, prefixes } = job.data;
    logger.log(`Add ${folderName} folder.`);

    /**
     * Asynchronously returns the name of each files present in the folder.
     * Use the {/*.txt} pattern from the glob package.
     * @function
     * @param {string} folder - The path of the folder.
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

    /**
     * Returns the list of file names in the folder with the extention .fa,
     * .faa, .fasta, .fas, .pep.
     * @function
     * @param {string} path - The path of the folder.
     * @returns {Array} List of file names without their extensions.
     */
    const prefixesFolder = (path) => {
      logger.log('coucou 2?');
      glob(`${path}/*.{fa,faa,fasta,fas,pep}`, (err, files) => {
        if (!err) {
          logger.log(files);
        } else {
          logger.log(err);
        }
      });
    };

    const newickProcessor = new NewickProcessor('test');

    logger.log('prefixe : ', prefixes);

    // fs.stat(prefixes)
    //   .then(async (err, stats) => {
    //     await globListFilesFolder
    //   })

    // fs.stat(prefixes, (err, stats) => {
    //   if (!err) {
    //     if (stats.isDirectory()) {
    //       logger.log('is directory? ', stats.isDirectory());
    //       logger.log('prout :', prefixes);
    //       // const a = await globListFilesFolder(prefixes);
    //       // return a;
    //     } else if (stats.isFile()) {
    //       logger.log('is file ? ', stats.isFile());
    //     }
    //   } else {
    //     logger.error(err);
    //   }
    // });

    async function f1(path) {
      return new Promise((resolve, reject) => {
        fs.stat(path, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    }

    async function f2(path) {
      return new Promise((resolve, reject) => {
        glob(`${path}/**.{fa,faa,fasta,fas,pep}`, (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        });
      });
    }

    async function f3(prfx) {
      return new Promise((resolve, reject) => {
        try {
          const listPrfx = prfx.map((path) => path.replace(/.*\/|\.[^.]*$/g, ''));
          resolve(listPrfx);
        } catch (err) {
          reject(err);
        }
      });
    }

    async function f4(file) {
      return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
          if (err) {
            reject.error(err);
          }
          resolve(data);
        });
      });
    }

    async function f5(prfx) {
      return new Promise((resolve, reject) => {
        try {
          const listPrfx = prfx.split(',').filter((element) => element.trim());
          resolve(listPrfx);
        } catch (err) {
          reject(err);
        }
      });
    }

    // const path_prefixe = path.resolve(prefixes);
    const stats = await f1(prefixes);
      // .then(() => logger.log(stats))
      // .catch((e) => {
      //   logger.warn('Not a file or folder', e);
      // });

    let cleanListPrefixes;

    if (stats && stats.isDirectory()) {
      // const pathway = path.resolve(prefixes);
      logger.log('is Directory :', stats.isDirectory());

      const listPrefixes = await f2(prefixes);
      logger.log('list prefixes :', listPrefixes);

      cleanListPrefixes = await f3(listPrefixes);
      logger.log('clean list prefixes :', cleanListPrefixes);
    } else if (stats && stats.isFile()) {
      // const pathway = path.resolve(prefixes);
      logger.log('is File :', stats.isFile());

      const listPrefixes = await f4(prefixes);
      logger.log('clean list prefixes :', listPrefixes);

      cleanListPrefixes = await f5(listPrefixes);
      logger.log('clean list prefixes :', cleanListPrefixes);
    } else if (typeof prefixes === 'string' && typeof prefixes !== 'undefined') {
      cleanListPrefixes = await f5(prefixes);
      logger.log('clean list prefixes :', cleanListPrefixes);
    }

    // Iterate over all files in th e folder.
    globListFilesFolder(folderName)
      .then(async (fileNames) => {
        const results = await Promise.all(
          fileNames.map(
            //async (file) => newickProcessor.parse(file, prefixes),
            async (file) => logger.log({file}),
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
