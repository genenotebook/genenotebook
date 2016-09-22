Meteor.publishComposite('singleGene',function(ID){
	return {
		find: function(){
			return Genes.find({'ID':ID});
		},
		children: [
			{
				find: function(gene){
					return Orthogroups.find({'ID':gene.orthogroup})
				}
			},
			{
				find: function(gene){
					if (gene.domains !== undefined){
						var domains = gene.domains.InterPro
					} else {
						var domains = []
					}
					return Interpro.find({'ID':{$in:domains}})
				}
			}
		]
	}
})

Meteor.publish('genes',function(limit,search,query){
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

Meteor.publish('orthogroup',function(ID){
	return Orthogroups.find({ 'ID': ID })
})

Meteor.publish('browser',function(track,seqid,start,end){
	return Genes.find({ 'seqid': seqid, 'start': { $gte: start }, 'end': { $lte: end } })
})

Meteor.publish('userList',function(){
	return Meteor.users.find({});
})

Meteor.publish('experiments',function(){
	return Experiments.find({});
})

Meteor.publish('tracks',function(){
	return Tracks.find({});
});
