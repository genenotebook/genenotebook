/*
Meteor.publish('singleGene',function(ID){
	return Genes.find({'ID':ID})
})
*/

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
			}
		]
	}
})

Meteor.publish('genes',function(limit,search,query){
	var limit = limit || 40;
	var query = query || {};
	if (search) {
		query.$or = [{'ID':{$regex:search}},{'attributes.Name':{$regex:search}}];
		if (!query.hasOwnProperty('attributes.Productname')){
			query.$or.push({'attributes.Productname':{$regex:search}})
		}
	}
	//console.log(query)
	return Genes.find(query,{limit:limit,sort:{'ID':1}})
})

Meteor.publish('orthogroup',function(ID){
	return Orthogroups.find({'ID':ID})
})

Meteor.publish('browser',function(track,seqid,start,end){
	return Genes.find({'seqid':seqid,'start':{$gte:start},'end':{$lte:end}})
})

Meteor.publish('userList',function(){
	return Meteor.users.find({});
})

Meteor.publish('interpro',function(){
	return Interpro.find();
})

Meteor.publish('tracks',function(){
	return Tracks.find({});
});
