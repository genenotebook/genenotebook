Meteor.publish('genes',function(limit, search, query) {
		const publication = this;
		if (!publication.userId){
			publication.ready()
		}
		publication.autorun( (computation) => {
			limit = limit || 40;
			query = query || {};
			if (search) {
				query.$or = [{ 'ID': { $regex: search , $options: 'i' } },{ 'Name': { $regex: search , $options: 'i' } }];
				if (!query.hasOwnProperty('Productname')){
					query.$or.push({ 'Productname': { $regex: search , $options: 'i' } })
				}
			}

			const roles = Roles.getRolesForUser(publication.userId);
			const visibleSamples = Experiments.find({ permissions: { $in: roles } }, { _id: 1 }).fetch()
			const sampleIds = visibleSamples.map( (sample) => { return sample._id })

			//return Genes.find(query,{ limit: limit, sort: { 'ID': 1 } })
			Genes.aggregate([
				{ $match: query },
				{ $limit: limit },
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
			], function(err,res){
				if (err){
					throw new Meteor.Error(err)
				}
				res.forEach( (gene) => {
					console.log(`genelist ${gene.ID} ${gene._id}`)
					publication.added('genes',gene._id,gene)
				})
			})
			publication.ready()
		})

	})

Meteor.publish('singleGene',function(geneId){
	if (!this.userId){
		this.ready()
	}
	console.log(geneId)
	
	//first find out which transcriptome samples the current user has acces to
	const roles = Roles.getRolesForUser(this.userId);
	const visibleSamples = Experiments.find({ permissions: { $in: roles } }, { _id: 1 }).fetch()
	const sampleIds = visibleSamples.map( (sample) => { return sample._id })
	
	// Remember, ReactiveAggregate doesn't return anything
	ReactiveAggregate(this, Genes, [
		{ $match: { ID: geneId } },
		{ $addFields: {
			expression: {
				$filter: {
					input: '$expression',
					as: 'sample',
					cond: { $in: ['$$sample.experimentId', sampleIds] }
				}
			}
		}}
	])
})

Meteor.publish(null, function () {
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
})

Meteor.publish({
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
	attributes (){
		if (!this.userId){
			this.ready()
			//throw new Meteor.Error('Unauthorized')
		}
		return Attributes.find({});
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
