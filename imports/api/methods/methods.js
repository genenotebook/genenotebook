import { Meteor } from 'meteor/meteor';
import { spawn } from 'child_process';
import Future from 'fibers/future';

import { Genes } from '/imports/api/genes/geneCollection.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { EditHistory } from '/imports/api/genes/edithistory_collection.js';

import { reverseComplement, translate, getGeneSequences } from '/imports/api/util/util.js';
import logger from '/imports/api/util/logger.js';

import hash from 'object-hash';

Meteor.methods({
  /**
	 * formatFasta description
	 * @param  {Object} query        Database query to select genes
	 * @param  {String} sequenceType One of 'protein' or 'nucleotide'
	 * @return {Array}               Array of fasta formatted coding sequences
	 */
  formatFasta (query, sequenceType) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    logger.debug('formatFasta');
    logger.debug(query);

    const fasta = Genes.find(query).map((gene, index) => {
      const transcriptFasta = getGeneSequences(gene).map((transcript) => {
        const sequence = sequenceType === 'protein' ? transcript.pep : transcript.seq;
        const wrappedSequence = sequence.match(/.{1,60}/g).join('\n');
        return `>${transcript.ID}\n${wrappedSequence}\n`;
      }).join('');
      return transcriptFasta;
    });

    return fasta;
  },
  removeFromViewing (geneId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    Genes.update({ ID: geneId }, { $pull: { viewing: this.userId } }, (err, res) => {
      if (err) {
        throw new Meteor.Error('removeFromViewing server method error');
      }
      const gene = Genes.findOne({ ID: geneId });
      logger.debug(gene);
      // if ( viewing.length === 0 ){
      // Genes.update({ 'ID': geneId },{ $unset: { 'viewing': 1 } } )
      // }
    });
  },
  /**
	 * If a gene is being edited it is locked so other users can not edit it as well.
	 * @param  {String} geneId Gene ID of the gene that should be locked for editing
	 * @return {undefined}        No return value
	 */
  lockGene (geneId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'curator')) {
      throw new Meteor.Error('not-authorized');
    }
    Genes.update({ ID: geneId }, { $set: { editing: this.userId } }, (err, res) => {
      if (err) {
        throw new Meteor.Error('Locking gene failed');
      }
      logger.debug(`${this.userId} is editing gene ${geneId}`);
    });
  },
  /**
	 * This unlocks a gene from being blocked during editing.
	 * A gene should only be unlocked by the person that locked it
	 * @param  {String} geneId Gene ID of the gene that should be locked for editing
	 * @return {undefined}        No return value
	 */
  unlockGene (geneId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'curator')) {
      throw new Meteor.Error('not-authorized');
    }
    const gene = Genes.findOne({ ID: geneId });
    if (!gene) {
      throw new Meteor.Error('not-authorized');
    }

    if (!gene.editing) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(gene.editing === this.userId)) {
      throw new Meteor.Error('not-authorized');
    }

    logger.debug('allow unlock ===', gene.editing === this.userId);
    if (gene.editing === this.userId) {
      logger.debug(`${this.userId} is no longer editing gene ${geneId}`);
      Genes.update({ ID: geneId }, { $set: { editing: 'Unlocking' } }, (err, res) => {
        if (err) {
          throw new Meteor.Error('Unlocking failed');
        }
        Genes.update({ ID: geneId }, { $unset: { editing: 1 } });
      });
    }
  },
});

Meteor.methods({
  updateExperiments (_id, fields) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }
    Experiments.update({ _id }, { $set: fields });
  },
	 updateUsers (_id, fields) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    Meteor.users.update({ _id }, { $set: fields });
  },
  updateAttributes (_id, fields) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }
    attributeCollection.update({ _id }, { $set: fields });
  },
  formatGff3 (query) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const genes = Genes.find(query);
    const total = genes.count();
    let counter = 0;
    const gff = genes.map(function(gene) {
      counter += 1;
      const subLines = gene.subfeatures.map(function(sub) {
        const subFields = [
          gene.seqid,
          gene.source,
          sub.type,
          sub.start,
          sub.end,
          sub.score,
          gene.strand,
          sub.phase,
          `ID=${sub.ID};Parents=${sub.parents.join()}`,
        ];
        return `${subFields.join('\t')}\n`;
      });
      const geneFields = [
        gene.seqid,
        gene.source,
        gene.type,
        gene.start,
        gene.end,
        gene.score,
        gene.strand,
        gene.phase,
        `ID=${gene.ID}`,
      ];
      const geneLine = `${geneFields.join('\t')}\n`;

      // unshift adds to the beginning of the array
      subLines.unshift(geneLine);

      return subLines.join('');
    });
    return gff;
  },
  initializeDownload (query, format) {
    queryHash = hash(query);
    queryString = JSON.stringify(query);
    existing = Downloads.findOne({ query: queryHash, format });
    let downloadId;
    if (existing === undefined) {
      downloadId = Downloads.insert({ query: queryHash, queryString, format });
      // return downloadId
    } else {
      downloadId = existing._id;
      // return existing._id
    }
  },
});
