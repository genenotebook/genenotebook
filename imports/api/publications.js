import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { Interpro } from '/imports/api/genes/interpro_collection.js';
import { Orthogroups } from '/imports/api/genes/orthogroup_collection.js';
import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';
import { References, ReferenceInfo } from '/imports/api/genomes/reference_collection.js';
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

    //get accessable tracks that user can subscribe to
    const tracks = Tracks.find({
      permissions: {
        $in: roles
      }
    }).map(track => track.trackName)

    //if a track is requested in the query it should be in the list of accessable tracks
    if ( query.hasOwnProperty('track') ){
      //array intersection in javascript: 
      //https://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
      const queryTracks = query['track']['$in'].filter(track => {
        return tracks.indexOf(track) !== -1
      })
      query.track = { $in: queryTracks }
    }

    return Genes.find(query, {sort: sort, limit: limit})
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
    const tracks = Tracks.find({
      permissions: { $in: roles }
    }).fetch().map(track => {
      return track._id
    })
    return Attributes.find({
      $or: [
        { tracks: { $in: tracks } },
        { allReferences: true }
      ]
    })
  },
  singleGene (geneId) {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    const tracks = Tracks.find({
      permissions: { $in: roles }
    }).fetch().map(track => {
      return track._id
    })
    return Genes.find({
      ID: geneId,
      trackId: {
        $in: tracks
      }
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
  referenceInfo () {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    const permissions = { $in: roles };
    return ReferenceInfo.find({ permissions })
  },
  orthogroups (ID) {
    if (!this.userId){
      this.stop()
    }
    return Orthogroups.find({ ID });
  },
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
  },
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

