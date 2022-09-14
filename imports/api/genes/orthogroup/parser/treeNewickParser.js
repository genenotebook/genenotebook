import { orthogroupCollection } from '/imports/api/genes/orthogroup/orthogroupCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';
import fs from 'fs';

/**
 * Read the newick trees, remove the prefixes from OrthoFinder and add the
 * information to the 'orthologroups' collection (mongodb).
 * @class
 * @constructor
 * @public
 */
class NewickProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
    // this.orthogroupDb = orthogroupCollection.rawCollection().initializeUnorderedBulkOp();
  }

  /**
   * Function that reads trees in newick format and returns the tree in .json,
   * all the names of each node and the size.
   * @function
   * @param {String} newickFile - The tree in newick format (e.g
   * (((Citrus_sinensis_PAC-18136225:0.464796,(Ano...).
   * @return {Object} Return the tree in json format.
   * @return {Array} Return the root name and the name of each leaf node.
   * @return {Number} Return the tree size.
   */
  parseNewick = (newickFile) => {
    // Adapted from Jason Davies https://github.com/jasondavies/newick.js
    const ancestors = [];
    const tokens = newickFile.split(/\s*(;|\(|\)|,|:)\s*/);
    const geneIds = [];
    let tree = {};
    let subtree = {};
    let nNodes = 0;
    tokens.forEach((token, tokenIndex) => {
      switch (token) {
        case '(': // new subtree (children of current tree)
          subtree = {};
          tree.children = [subtree];
          ancestors.push(tree);
          tree = subtree;
          break;
        case ',': // another branch
          subtree = {};
          ancestors[ancestors.length - 1].children.push(subtree);
          tree = subtree;
          break;
        case ')': // optional name next
          tree = ancestors.pop();
          break;
        case ':': // optional length next
          break;
        default:
          const previousToken = tokens[tokenIndex - 1];
          if (previousToken === '(' || previousToken === ')' || previousToken === ',') {
            tree.name = token;
            nNodes += 1;
            if (token.length > 0) {
              geneIds.push(token);
            }
          } else if (previousToken === ':') {
            tree.branchLength = parseFloat(token);
          }
      }
    });
    return {
      tree,
      geneIds,
      treeSize: 0.5 * (nNodes + 1), // geneIds.length
    };
  };

  removePrefixGeneId = async (prefixes, genesids) => {
    return new Promise((resolve, reject) => {
      try {
        const myArray = genesids.map((el) => {
          for (const i in prefixes) {
            if (el.includes(prefixes[i])) {
              const underscorePrefix = prefixes[i].concat('_');
              const removePrefix = el.replace(underscorePrefix, '');
              return removePrefix;
            }
          }
          return el;
        });
        resolve(myArray);
      } catch (err) {
        reject(err);
      }
    });
  };

  parse = async (newick, prefixes) => {
    // Read newick file.
    const treeNewick = fs.readFileSync(newick, 'utf8');

    const { tree, treeSize, geneIds } = this.parseNewick(treeNewick);

    const cleanGeneIds = (prefixes ? await this.removePrefixGeneId(prefixes, geneIds) : geneIds);

    // Search the gene collection for the gene identifier.
    const orthogroupGenes = await Genes.rawCollection()
      .find(
        {
          $or: [
            { ID: { $in: cleanGeneIds } },
            { 'subfeatures.ID': { $in: cleanGeneIds } },
          ],
        },
      )
      .toArray();

    // If the identifier is a sub-feature return to the gene identifier.
    const orthogroupGeneIds = orthogroupGenes.map(({ ID }) => ID);

    // Remove duplicate value.
    const rmDuplicateGeneIDs = orthogroupGeneIds.filter((v, i, a) => a.indexOf(v) === i);

    // Warn when the gene is not in the database.
    if (rmDuplicateGeneIDs.length !== 0) {
      const documentOrthogroup = await orthogroupCollection.rawCollection().update(
        { geneIds: { $in: rmDuplicateGeneIDs } }, // query
        {
          $set:
          {
            geneIds: rmDuplicateGeneIDs,
            tree: tree,
            size: treeSize,
          },
        }, // changes
        {
          multi: true,
          upsert: true,
        }, // options
      );

      // Update or insert orthogroupsId in genes collection.
      if (typeof documentOrthogroup.insertedId !== 'undefined') {
        // Orthogroups _id is created.
        logger.log('create _id', documentOrthogroup.insertedId);
        this.genesDb.update(
          { ID: { $in: rmDuplicateGeneIDs } },
          { $set: { orthogroups: documentOrthogroup.insertedId } },
          {
            multi: true,
            upsert: true,
          },
        );
      } else {
        // Orthogroups tree already exists.
        const orthogroupIdentifiant = orthogroupCollection.findOne({ tree: tree })._id;
        logger.log('already exist :', orthogroupIdentifiant);
        this.genesDb.update(
          { ID: { $in: rmDuplicateGeneIDs } },
          { $set: { orthogroups: orthogroupIdentifiant } },
          {
            multi: true,
            upsert: true,
          },
        );
      }
    } else {
      logger.warn(
        'Orthogroup consists exclusively of genes not in the database',
      );
    }
  };
}

export default NewickProcessor;
