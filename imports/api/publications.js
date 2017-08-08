import { Meteor } from 'meteor/meteor';
import { publishComposite } from 'meteor/reywood:publish-composite';
//import jobQueue from '/imports/startup/server/fixtures.js';

Meteor.publish('genes',function(limit, search, query) {
  console.log('publishing gene list')
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
  console.log('publishing single gene')
  const publication = this;
  if (!publication.userId){
    publication.stop()
  }

  const roles = Roles.getRolesForUser(publication.userId);

  return {
    find(){
      console.log('finding genes')
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
          console.log('finding experiment data')
          return Expression.find({
            geneId: gene.ID,
            permissions: {
              $in: roles
            }
          })
        },
        children: [
        {
          find(expression){
            console.log('finding experiment info')
            return ExperimentInfo.find({
              _id: expression.experimentId,
              permissions: {
                $in: roles
              }
            })
          }
        }
        ]
      },
      {
        find(gene){
          console.log('finding reference sequence')
          let res = References.find({
            header: gene.seqid,
            $and: [
              { start: { $lte: gene.end } },
              { end: { $gte: gene.start } }
            ],
            permissions: {
              $in: roles
            }
          }).fetch()
          console.log(res.length)
          return References.find({
            header: gene.seqid,
            $and: [
              { start: { $lte: gene.end } },
              { end: { $gte: gene.start } }
            ],
            permissions: {
              $in: roles
            }
          })
        }
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
                reference: reference.referenceName
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

Meteor.publish(null, function () {
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
