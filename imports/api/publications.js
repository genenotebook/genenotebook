import { Meteor } from 'meteor/meteor';
import { publishComposite } from 'meteor/reywood:publish-composite';
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

Meteor.publish('genes',function(limit, search, query) {
  //console.log('publishing gene list')
  const publication = this;
  if (!publication.userId){
    publication.stop()
  }

  limit = limit || 40;
  query = query || {};
  if (search) {
    query.$or = [{ 'ID': { $regex: search , $options: 'i' } },{ 'Name': { $regex: search , $options: 'i' } }];
    if (!query.hasOwnProperty('Productname')){
      query.$or.push({ 'Productname': { $regex: search , $options: 'i' } })
    }
  }

  const roles = Roles.getRolesForUser(publication.userId);

  query.permissions = { $in: roles }

  return Genes.find(query,{limit: limit})
})

publishComposite('singleGene', function(geneId){
  //console.log('publishing single gene')
  const publication = this;
  if (!publication.userId){
    publication.stop()
  }

  const roles = Roles.getRolesForUser(publication.userId);

  return {
    find(){
      return Genes.find({
        ID: geneId,
        permissions: {
          $in: roles
        }
      })
    },
    children: [
      {
        find(gene){
          return Transcriptomes.find({
            geneId: gene.ID,
            permissions: {
              $in: roles
            }
          })
        },
        children: [
        {
          find(transcriptome){
            return ExperimentInfo.find({
              _id: transcriptome.experimentId,
              permissions: {
                $in: roles
              }
            })
          }
        }
        ]
      }
    ]
  }
})

publishComposite('attributes', function(){
  const publication = this;
  if (!publication.userId){
    publication.stop()
  }

  const roles = Roles.getRolesForUser(publication.userId);

  return {
    find(){
      return ReferenceInfo.find({
        permissions: {
          $in: roles
        }
      })
    },
    children: [
      {
        find(reference){
          return Attributes.find({
            $or: [
              {
                references: reference.referenceName
              },
              {
                allReferences: true 
              }
            ]
          })
        }
      }
    ]
  }
})

Meteor.publish('users', function () {
  if (!this.userId){
    this.stop()
    //throw new Meteor.Error('Unauthorized')
  }
  if (Roles.userIsInRole(this.userId,'admin')){
    return Meteor.users.find({});
  } else if (Roles.userIsInRole(this.userId,['user','curator'])){
    return Meteor.users.find({},{fields:{username:1}})
  } else {
    this.ready()
    //throw new Meteor.Error('Unauthorized')
  }
})

Meteor.publish({
  jobQueue () {
    return jobQueue.find({});
  },
  referenceInfo () {
    const publication = this;
    if (!publication.userId){
      publication.stop()
    }
    const roles = Roles.getRolesForUser(publication.userId);
    return ReferenceInfo.find({
      permissions: {
        $in: roles
      }
    })
  },
  orthogroups (ID) {
    if (!this.userId){
      this.stop()
    }
    return Orthogroups.find({ 'ID': ID });
  },
  experimentInfo (){
    if (!this.userId){
      this.stop()
      //throw new Meteor.Error('Unauthorized')
    }
    return ExperimentInfo.find({});
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
      //throw new Meteor.Error('Unauthorized')
    }
    return Interpro.find({});
  },
  editHistory (){
    if (!this.userId){
      this.stop()
      //throw new Meteor.Error('Unauthorized')
    }
    return EditHistory.find({});
  }
})

/*
Meteor.publish('browser',function(track,seqid,start,end){
  return Genes.find({ 'seqid': seqid, 'start': { $gte: start }, 'end': { $lte: end } });
})
*/
