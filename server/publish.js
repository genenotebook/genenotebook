import { publishComposite } from 'meteor/reywood:publish-composite';

Meteor.publish('genes',function(limit, search, query) {
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
	/*
	const roles = Roles.getRolesForUser(publication.userId);
	const visibleSamples = Experiments.find({ permissions: { $in: roles } }, { _id: 1 }).fetch()
	const sampleIds = visibleSamples.map( (sample) => { return sample._id })

	// Remember, ReactiveAggregate doesn't return anything
	ReactiveAggregate(publication, Genes, [
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
	])
	*/
	console.log(query)
	return Genes.find(query,{limit: limit})
})

/*
Meteor.publish('singleGene',function(geneId){
	const publication = this;
	if (!publication.userId){
		publication.stop()
	}
	
	//first find out which transcriptome samples the current user has acces to
	const roles = Roles.getRolesForUser(publication.userId);
	const visibleSamples = Experiments.find({ permissions: { $in: roles } }, { _id: 1 }).fetch()
	const sampleIds = visibleSamples.map( (sample) => { return sample._id })
	
	// Remember, ReactiveAggregate doesn't return anything
	ReactiveAggregate(publication, Genes, [
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
*/

publishComposite('singleGene', function(geneId){
	const publication = this;
	if (!publication.userId){
		publication.stop()
	}

	const roles = Roles.getRolesForUser(publication.userId);

	return {
		find(){
			console.log('finding gene')
			return Genes.find({ID: geneId})
		},
		children: [
			{
				find(gene){
					console.log('finding expression values')
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
					console.log('finding sequence data')
					return References.find({
						header: gene.seqid,
						$and: [
							{
								start: {
									$lte: gene.end
								},
								end: {
									$gte: gene.start
								}
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
		console.log('publish jobQueue')
		return jobQueue.find({});
	},
	references () {
		if (!this.userId){
			this.stop()
		}
		return References.find({});
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
		if (!this.userId){
			this.stop()
			//throw new Meteor.Error('Unauthorized')
		}
		return Tracks.find({});
	},
	attributes (){
		if (!this.userId){
			this.stop()
			//throw new Meteor.Error('Unauthorized')
		}
		return Attributes.find({});
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
