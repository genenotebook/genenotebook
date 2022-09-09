import { orthogroupCollection, orthogroupSchema } from '/imports/api/genes/orthogroup/orthogroupCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';
import fs from 'fs';

class NewickProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
    this.orthogroupDb = orthogroupCollection.rawCollection().initializeUnorderedBulkOp();
  }

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
      size: 0.5 * (nNodes + 1), // geneIds.length
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
    logger.log(newick);

    /**
     * Only return the basename (remove the pathname and extension).
     * (e.g. /genenotebook/data/OG0000001_tree.txt -> OG0000001_tree)
     */
    const basenameFile = newick.split('/').pop().split('.')[0];
    logger.log('basename :', basenameFile);

    /** Read newick file. */
    const treeNewick = fs.readFileSync(newick, 'utf8');
    logger.log('tree :', treeNewick);

    /**
     * Return the size and file name of each proteome as name for these species.
     * (https://davidemms.github.io/orthofinder_tutorials/orthofinder-best-practices.html)
     * e.g. (geneIds : ['Citrus_sinensis_PAC-18136225', 'Anothera_thingus_PAC-518136218'])
     * Problem ID saved in the Gene collection doesn't include the name of the
     * file only the ID of the genes.
     * e.g. In Gene collection : ("subfeatures.ID":"PAC-918136217").
     */
    const { size, geneIds } = this.parseNewick(treeNewick);
    logger.log('size :', size);
    logger.log('prefixes to remove:', prefixes);
    logger.log('geneIds :', geneIds);

    const cleanGeneIds = (prefixes ? await this.removePrefixGeneId(prefixes, geneIds) : geneIds);
    logger.log('Clean geneIds :', cleanGeneIds);

    // Find genes belonging to orthogroup.
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

    logger.log('orthogroupGenes find() :', orthogroupGenes);
  };
}

async function addOrthogroupTree({ fileName }) {
  // Turn filename into orthogroup ID
  const orthogroupId = fileName.split('/').pop().split('.')[0];

  // Parse newick formatted treefile
  const treeNewick = fs.readFileSync(fileName, 'utf8');
  const { size, geneIds } = parseNewick(treeNewick);

  logger.debug({ treeNewick });
  logger.log('orthogroupId :', orthogroupId);
  logger.log('size :', size);
  logger.log('tree :', treeNewick);
  logger.log('geneIds :', geneIds);

  // Set up data to insert
  const orthogroupData = {
    ID: orthogroupId,
    size,
    tree: treeNewick,
    geneIds,
  };

  // Validate data against orthogroup schema
  // this throws an error for invalid data
  await orthogroupSchema.validate(orthogroupData);

  logger.log('validate schema');

  // Insert orthogroup data.
  await orthogroupCollection.rawCollection().insert(orthogroupData);

  // Find genes belonging to orthogroup.
  const orthogroupGenes = await Genes.rawCollection()
    .find(
      {
        $or: [
          { ID: { $in: geneIds } },
          { 'subfeatures.ID': { $in: geneIds } },
        ],
      },
    )
    .toArray();

  logger.log('orthogroupGenes find() :', orthogroupGenes);

  const orthogroupGeneIds = orthogroupGenes.map(({ ID }) => ID);
  if (orthogroupGeneIds.size === 0) {
    logger.warn(
      `Orthogroup ${orthogroupId} consists exclusively of genes \
      not in the database`,
    );
  }

  logger.log('orthogroupGenesIds :', orthogroupGeneIds);

  // Update genes in orthogroups with orthogroup ID
  await Genes.rawCollection().update(
    { ID: { $in: orthogroupGeneIds } }, // query
    { $set: { orthogroupId } }, // changes
    { multi: true }, // options
  );

  return orthogroupGeneIds.length;
}

export default NewickProcessor;
