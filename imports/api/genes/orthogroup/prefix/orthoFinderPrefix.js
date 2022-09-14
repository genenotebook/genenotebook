import logger from '/imports/api/util/logger.js';
import glob from 'glob';
import fs from 'fs';

/**
 * Set of functions that will allow to remove the prefixes used by OrthoFinder
 * to name the nodes of the tree.
 * See https://davidemms.github.io/orthofinder_tutorials/orthofinder-best-practices.html
 * in paragraph 'Pre-processing of input proteomes'.
 * Removing prefixes (OrthoFinder behavior) allows to find the gene identifier
 * in the gene collection.
 * @class
 * @constructor
 * @public
 * @param {String} prefixes - The list of the prefixes that match each proteome
 * file name as the name of this species.
 */
class OrthoFinderPrefix {
  constructor(prefixes) {
    this.prefixes = prefixes;
  }

  /**
   * Asynchronously returns the name of each files present in the folder.
   * Use the {/*.txt} pattern from the glob package.
   * @function
   * @param {String} folder - The path of the folder.
   */
  globListFilesFolder = (folder) => {
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
   * Asynchronous function that returns file or folder statistics.
   * @function
   * @param {String} path - The path of the file or folder.
   * @returns {String} file or folder statistics.
   */
  getStatsPath = async (path) => {
    return new Promise((resolve, reject) => {
      fs.stat(path, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };

  /**
   * Asynchronous function that returns the list of file names in the folder
   * with the extention .fa, .faa, .fasta, .fas, .pep.
   * @function
   * @param {String} path - The path of the folder.
   * @returns {Array} List of file names with their extensions.
   */
  getPrefixes = async (path) => {
    return new Promise((resolve, reject) => {
      glob(`${path}/**.{fa,faa,fasta,fas,pep}`, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  };

  /**
   * Asynchronous function that returns the list of basenames files without
   * their extensions.
   * @function
   * @param {Array} prfx - The list of prefixes.
   * @returns {Array} List of file names without their extensions.
   */
  getBasenameNoExtension = async (prfx) => {
    return new Promise((resolve, reject) => {
      try {
        const listPrfx = prfx.map((path) => path.replace(/.*\/|\.[^.]*$/g, ''));
        resolve(listPrfx);
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Asynchronous function that reads the text file.
   * @function
   * @param {String} file - The pathway of file.
   * @returns {Array} List of filenames.
   */
  readPrefixeFile = async (file) => {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject.error(err);
        }
        resolve(data);
      });
    });
  };

  /**
   * Asynchronous function that split by comma the list of proteome filenames.
   * @function
   * @param {Array} prfx - The string of all prefixes.
   * @returns {Array} List of prefixes.
   */
  splitPrefixes = async (prfx) => {
    return new Promise((resolve, reject) => {
      try {
        const listPrfx = prfx.split(',').filter((element) => element.trim());
        resolve(listPrfx);
      } catch (err) {
        reject(err);
      }
    });
  };

  getListPrefixes = async () => {
    const stats = await this.getStatsPath(this.prefixes)
      .then((s) => s)
      .catch((e) => {
        logger.warn('Not a file or folder', e);
        return undefined;
      });

    if (stats && stats.isDirectory()) {
      const listPrefixes = await this.getPrefixes(this.prefixes);
      const list = await this.getBasenameNoExtension(listPrefixes);
      return list;
    } else if (stats && stats.isFile()) {
      const listPrefixes = await this.readPrefixeFile(this.prefixes);
      const list = await this.splitPrefixes(listPrefixes);
      return list;
    } else if (typeof this.prefixes === 'string' && typeof this.prefixes !== 'undefined') {
      const list = await this.splitPrefixes(this.prefixes);
      return list;
    }
  };
}

export default OrthoFinderPrefix;
