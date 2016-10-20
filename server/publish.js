Meteor.publishComposite('singleGene',function(geneId){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
	}
	Genes.update({ 'ID': geneId },{ $addToSet: { 'viewing': this.userId } })
	return {
		find: function(){
			return Genes.find({'ID':geneId});
		},
		children: [
			{
				find: function(gene){
					return Orthogroups.find({'ID':gene.orthogroup})
				}
			},
			{
				find: function(gene){
					const domains = []
					if (gene.domains !== undefined){
						domains.push(...gene.domains.InterPro)
					} 
					return Interpro.find({'ID':{$in:domains}})
				}
			}
		]
	}
})

Meteor.publish('genes',function(limit,search,query){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
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
})

Meteor.publish('orthogroups',function(ID){
	return Orthogroups.find({ 'ID': ID });
})

/*
Meteor.publish('browser',function(track,seqid,start,end){
	return Genes.find({ 'seqid': seqid, 'start': { $gte: start }, 'end': { $lte: end } });
})
*/

Meteor.publish('userList',function(){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
	}
	if (Roles.userIsInRole(this.userId,'admin')){
		return Meteor.users.find({});
	} else if (Roles.userIsInRole(this.userId,['user','curator'])){
		return Meteor.users.find({},{fields:{username:1}})
	} else {
		throw new Meteor.Error('Unauthorized')
	}
})

Meteor.publish('experiments',function(){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
	}
	return Experiments.find({});
})

Meteor.publish('tracks',function(){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
	}
	return Tracks.find({});
});

Meteor.publish('filterOptions',function(){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
	}
	return FilterOptions.find({});
})

Meteor.publish('interpro',function(){
	if (!this.userId){
		throw new Meteor.Error('Unauthorized')
	}
	return Interpro.find({});
})
