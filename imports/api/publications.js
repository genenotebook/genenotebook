import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { Interpro } from '/imports/api/genes/interpro_collection.js';
import { Orthogroups } from '/imports/api/genes/orthogroup_collection.js';
import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
//import { Tracks } from '/imports/api/genomes/track_collection.js';
import { genomeSequenceCollection, genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';

Meteor.publish({
  genes({query, limit, sort}){
    console.log('publishing gene list')
    console.log('limit', limit)
    console.log('sort', sort)
    console.log('query', query)
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }

    limit = limit || 40;
    query = query || {};
    sort = sort || {};

    //get user roles
    const roles = Roles.getRolesForUser(publication.userId);

    //get Ids of genomes user has access to
    const userGenomes = genomeCollection.find({ 
      permissions: { 
        $in: roles 
      } 
    }).map(genome => genome._id)

    if (query.hasOwnProperty('genomeId')){
      const queryGenomes = query.genomeId['$in'].filter(genomeId => {
        //return userGenomes.indexOf(genomeId) !== -1
        return userGenomes.includes(genomeId)
      });
      query.genomeId['$in'] = queryGenomes;
    } else {
      query.genomeId = { $in: userGenomes };
    }

    return Genes.find(query, {sort: sort, limit: limit})
  },
  singleGene (geneId) {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    
    const genomeIds = genomeCollection.find({
      permissions: { $in: roles }
    }).map(genome => {
      return genome._id
    })
    return Genes.find({
      ID: geneId,
      genomeId: {
        $in: genomeIds
      }
    })
  },
  users(){
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }

    if (!Roles.userIsInRole(publication.userId, 'admin')){
      publication.stop()
    };

    return Meteor.users.find({});
  },
  roles(){
    const publication = this;
    
    if (!publication.userId){
      publication.stop()
    };

    if (!Roles.userIsInRole(publication.userId, 'admin')){
      publication.stop()
    };

    return Meteor.roles.find({});
  },
  attributes(){
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    const genomes = genomeCollection.find({
      permissions: { $in: roles }
    }).fetch().map(genome => genome._id)
    /*const tracks = Tracks.find({
      permissions: { $in: roles }
    }).fetch().map(track => {
      return track._id
    })*/
    return Attributes.find({
      $or: [
        { genomes: { $in: genomes } },
        { allGenomes: true }
      ]
    })
  },
  geneExpression (geneId) {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    const permissions = { $in: roles };
    const experimentIds = ExperimentInfo.find({ permissions })
      .fetch()
      .map(experiment => experiment._id);
    
    return Transcriptomes.find({
      geneId: geneId,
      experimentId : {
        $in: experimentIds
      }
    })
  },
  experimentInfo (){
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    const permissions = { $in: roles };
    return ExperimentInfo.find({ permissions });
  },
  downloads (downloadId) {
    const publication = this;
    const roles = publication.userId ? Roles.getRolesForUser(publication.userId) : ['public'];
    return Downloads.findOne({ID: downloadId, permission: {$in: roles} });
  },
  jobQueue () {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    return jobQueue.find({});
  },
  genomes () {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    const permissions = { $in: roles };
    return genomeCollection.find({ permissions })
  },
  orthogroups (ID) {
    if (!this.userId){
      this.stop()
    }
    return Orthogroups.find({ ID });
  },/*
  tracks (){
    const publication = this;
    if (!publication.userId){
      publication.stop()
      //throw new Meteor.Error('Unauthorized')
    }
    const roles = Roles.getRolesForUser(publication.userId);
    console.log(`tracks publication for user ${publication.userId} with roles ${roles}`)
    return Tracks.find({
      permissions: {
        $in: roles
      }
    });
  },*/
  interpro (){
    if (!this.userId){
      this.stop()
    }
    return Interpro.find({});
  },
  editHistory (){
    if (!this.userId){
      this.stop()
    }
    return EditHistory.find({});
  }
})

