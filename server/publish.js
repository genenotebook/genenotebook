/*import { publishComposite } from 'meteor/reywood:publish-composite';

publishComposite('singleGene',function(geneId){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	} else if (this.userId !== null){
		Genes.update({ ID: geneId },{ $addToSet: { viewing: this.userId } })
	}

	const roles = Roles.getRolesForUser(this.userId);
	const visibleSamples = Experiments.find({ permissions: { $in: roles } }, { _id: 1 }).fetch()
	const sampleIds = visibleSamples.map( (sample) => { return sample._id })
	return {
		find () {
			//use find instead of findOne, since this should return a cursor (publishComposite implementation quirk?)
			//return Genes.find({ ID: geneId },{ expression: { $elemMatch: { experimentId: { $in: sampleIds } } } } );
			
			let self = this;
			console.log(sampleIds)

			let genes = Genes.aggregate([
				{ $match: { ID: geneId } },
				{ $addFields: { 
					expression: { 
						$filter: { 
							input: '$expression', 
							as: 'sample', 
							cond: { $in: ['$$sample.experimentId',sampleIds] }
						}
					}
				}
			}
			], function(err,results){
				results.forEach( (gene) => {
					self.added('singleGene',gene._id,gene)
					//console.log(gene)
				} )
				self.ready()
			})

		},
		children: [
			{
				find (gene) {
					return Orthogroups.find({ ID:  gene.orthogroup})
				}
			},
			{
				find (gene) {
					let domains = []
					if ( gene.hasOwnProperty('domains') ){
						if ( gene.domains.hasOwnProperty('InterPro') ){
							domains = gene.domains.InterPro
						}
					} 
					return Interpro.find({ ID: { $in: domains } })
				}
			},
			{
				find (gene) {
					return EditHistory.find({ ID : gene.ID })
				}
			},
			{
				find (gene) {
					return Meteor.users.find({})
				}
			},
			{
				find (gene) {
					console.log('publishComposite References',gene)
					return References.find({ 
						header: gene.seqid,
						$and: [ 
							{ start: {$lt: gene.end} }, 
							{ end: {$gt: gene.start} }
						] 
					})
				}
			}
		]
	}
})
*/

Meteor.publish({
	genes (limit,search,query) {
		if (!this.userId){
			this.ready()
		}
		var limit = limit || 40;
		var query = query || {};
		if (search) {
			query.$or = [{ 'ID': { $regex: search , $options: 'i' } },{ 'Name': { $regex: search , $options: 'i' } }];
			if (!query.hasOwnProperty('Productname')){
				query.$or.push({ 'Productname': { $regex: search , $options: 'i' } })
			}
		}
		return Genes.find(query,{ limit: limit, sort: { 'ID': 1 } })
	},
	references (seqid) {
		if (!this.userId){
			this.ready()
		}
		return References.find({ header: seqid });
	},
	orthogroups (ID) {
		if (!this.userId){
			this.ready()
		}
		return Orthogroups.find({ 'ID': ID });
	},
	userList (){
		if (!this.userId){
			this.ready()
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
	},
	experiments (){
		if (!this.userId){
			this.ready()
			//throw new Meteor.Error('Unauthorized')
		}
		return Experiments.find({});
	},
	tracks (){
		if (!this.userId){
			this.ready()
			//throw new Meteor.Error('Unauthorized')
		}
		return Tracks.find({});
	},
	filterOptions (){
		if (!this.userId){
			this.ready()
			//throw new Meteor.Error('Unauthorized')
		}
		return FilterOptions.find({});
	},
	interpro (){
		if (!this.userId){
			this.ready()
			//throw new Meteor.Error('Unauthorized')
		}
		return Interpro.find({});
	},
	editHistory (){
		if (!this.userId){
			this.ready()
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
