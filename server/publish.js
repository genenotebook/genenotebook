Meteor.publishComposite('singleGene',function(geneId){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	} else if (this.userId !== null){
		Genes.update({ ID: geneId },{ $addToSet: { viewing: this.userId } })
	}
	
	return {
		find: function(){
			return Genes.find({ ID: geneId });
		},
		children: [
			{
				find: function(gene){
					return Orthogroups.find({ ID:  gene.orthogroup})
				}
			},
			{
				find: function(gene){
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
				find: function(gene){
					return EditHistory.find({ ID : gene.ID })
				}
			},
			{
				find: function(gene){
					return Meteor.users.find({})
				}
			},
			{
				find: function(gene){
					return References.find({ reference: gene.reference, header: gene.seqid })
				}
			}
		]
	}
})

Meteor.publish('genes',function(limit,search,query){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
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

Meteor.publish('references',function(seqid){
	if (!this.userId){
		this.ready()
	}
	return References.find({ header: seqid });
})

Meteor.publish('orthogroups',function(ID){
	if (!this.userId){
		this.ready()
	}
	return Orthogroups.find({ 'ID': ID });
})

/*
Meteor.publish('browser',function(track,seqid,start,end){
	return Genes.find({ 'seqid': seqid, 'start': { $gte: start }, 'end': { $lte: end } });
})
*/

Meteor.publish('userList',function(){
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

Meteor.publish('experiments',function(){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	}
	return Experiments.find({});
})

Meteor.publish('tracks',function(){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	}
	return Tracks.find({});
});

Meteor.publish('filterOptions',function(){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	}
	return FilterOptions.find({});
})

Meteor.publish('interpro',function(){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	}
	return Interpro.find({});
})

Meteor.publish('editHistory',function(){
	if (!this.userId){
		this.ready()
		//throw new Meteor.Error('Unauthorized')
	}
	return EditHistory.find({});
})
