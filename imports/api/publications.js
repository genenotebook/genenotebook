import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { Interpro } from '/imports/api/genes/interpro_collection.js';
import {
  orthogroupCollection,
} from '/imports/api/genes/orthogroup_collection.js';
import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import {
  ExperimentInfo,
  Transcriptomes,
} from '/imports/api/transcriptomes/transcriptome_collection.js';

function availableGenomes({ userId }) {
  const roles = Roles.getRolesForUser(userId);
  const genomeIds = genomeCollection
    .find({
      $or: [{ permission: { $in: roles } }, { isPublic: true }],
    })
    .map((genome) => genome._id);
  return genomeIds;
}

// publish user role assignment https://github.com/Meteor-Community-Packages/meteor-roles
Meteor.publish(null, function() {
  const publication = this;
  if (!publication.userId) {
    publication.stop();
  }
  if (Roles.userIsInRole(publication.userId, 'admin')) {
    return Meteor.roleAssignment.find();
  }

  return Meteor.roleAssignment.find({ 'user._id': this.userId });
});

Meteor.publish({
  genes({ query = {}, limit, sort = { ID: 1 } }) {
    const publication = this;
    const genomeIds = availableGenomes(publication);
    if (query.hasOwnProperty('genomeId')) {
      const queryGenomeIds = query.genomeId.$in.filter((genomeId) => genomeIds.includes(genomeId));
      query.genomeId.$in = queryGenomeIds;
    } else {
      query.genomeId = { $in: genomeIds };
    }

    return Genes.find(query, { sort, limit });
  },
  singleGene({ geneId, transcriptId }) {
    const publication = this;

    const genomeIds = availableGenomes(publication);

    const query = { genomeId: { $in: genomeIds } };
    if (typeof geneId === 'undefined') {
      Object.assign(query, { 'subfeatures.ID': transcriptId });
    } else {
      Object.assign(query, { ID: geneId });
    }

    return Genes.find(query);
  },
  users() {
    const publication = this;
    if (!publication.userId) {
      publication.stop();
    }

    if (Roles.userIsInRole(publication.userId, 'admin')) {
      return Meteor.users.find({});
    }
    return Meteor.users.find({ _id: publication.userId });
  },
  roles() {
    const publication = this;

    if (!publication.userId) {
      publication.stop();
    }

    return Meteor.roles.find({});
  },
  attributes() {
    const publication = this;

    const genomeIds = availableGenomes(publication);

    return attributeCollection.find({
      $or: [{ genomes: { $in: genomeIds } }, { allGenomes: true }],
    });
  },
  geneExpression(geneId) {
    const publication = this;
    const roles = Roles.getRolesForUser(publication.userId);
    const permission = { $in: roles };
    const isPublic = true;

    const experimentIds = ExperimentInfo.find({
      $or: [{ permission }, { isPublic }],
    })
      .fetch()
      .map((experiment) => experiment._id);

    return Transcriptomes.find({
      geneId,
      experimentId: {
        $in: experimentIds,
      },
    });
  },
  experimentInfo() {
    const publication = this;
    const roles = Roles.getRolesForUser(publication.userId);
    const permission = { $in: roles };
    const isPublic = true;
    return ExperimentInfo.find({
      $or: [{ permission }, { isPublic }],
    });
  },
  /* downloads (downloadId) {
    const publication = this;
    const roles = publication.userId ? Roles.getRolesForUser(publication.userId) : ['public'];
    return Downloads.findOne({ID: downloadId, permission: { $in: roles } });
  }, */
  jobQueue() {
    /*
    const publication = this;
    if (!publication.userId) {
      publication.stop();
    }
    */
    return jobQueue.find({});
  },
  genomes() {
    const publication = this;
    if (!publication.userId) {
      return genomeCollection.find({ isPublic: true });
    }
    const roles = Roles.getRolesForUser(publication.userId);
    return genomeCollection.find({
      $or: [{ permission: { $in: roles } }, { isPublic: true }],
    });
  },
  orthogroups(ID) {
    return orthogroupCollection.find({ ID });
  },
  interpro() {
    if (!this.userId) {
      this.stop();
    }
    return Interpro.find({});
  },
  editHistory() {
    if (!this.userId) {
      this.stop();
    }
    return EditHistory.find({});
  },
});
