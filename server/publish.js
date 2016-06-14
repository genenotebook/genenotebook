/*
Meteor.publishComposite('singleGene',function(ID){
	return {
		find: function(){
			return Genes.find({'type':'gene','ID':ID});
		},
		children: [
		{
			find:function(gene){
				return Genes.find({'ID':{$in: gene.children}});
			},
			children: [
			{
				find: function(transcript){
					return Genes.find({'ID':{$in: transcript.children}});
				}
			}]
		}]
	};
});
*/

Meteor.publish('singleGene',function(ID){
	return Genes.find({'ID':ID})
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

/*
Meteor.publishComposite('genes',function(limit,search,filter){
	var limit = limit || 40;
	console.log('search: '+search);
	console.log('limit: '+limit);
	console.log('filter: '+filter)

	return {
		find: function(){
			if (search){
				//var results = Genes.find({'type':'gene',$or:[{'ID':search},{'attributes.Name':search}]},{limit:limit,sort:{'ID':1}}).fetch();
				//console.log(results);
				return Genes.find({'type':'gene',$or:[{'ID':search},{'attributes.Name':search}]},{limit:limit,sort:{'ID':1}});				
			} else if (filter) {
				//var results = Genes.find({'type':'gene','ID':{$in:filter.gene_ids}},{limit:limit,sort:{'ID':1}}).fetch();
				//console.log(results);
				filter.type = 'gene'
				//return Genes.find({'type':'gene','ID':{$in:filter.gene_ids},'track':{$in:filter.tracks}},{limit:limit,sort:{'ID':1}});
				return Genes.find(filter,{limit:limit,sort:{'ID':1}});
			} else {
				return Genes.find({'type':'gene'},{limit:limit,sort:{'ID':1}});
			}
		},
		children: [
		{
			find:function(gene){
				return Genes.find({'ID':{$in: gene.children}});
			},
			children: [
			{
				find: function(transcript){
					return Genes.find({'ID':{$in: transcript.children}});
				}
			}]
		}]
	};
});
*/

Meteor.publish('browser',function(track,seqid,start,end){
	return Genes.find({'seqid':seqid,'start':{$gte:start},'end':{$lte:end}})
})


/*
Meteor.publishComposite('browser',function(track,seqid,start,end){
	return {
		find: function(){
			return Genes.find({'type':'gene','start':{$gte:start},'end':{$lte:end},'seqid':seqid,'track':track});
		},
		children: [
		{
			find:function(gene){
				return Genes.find({'ID':{$in: gene.children}});
			},
			children: [
			{
				find: function(transcript){
					return Genes.find({'ID':{$in: transcript.children}});
				}
			}]
		}]
	};
});
*/

Meteor.publish('userList',function(){
	return Meteor.users.find({});
})

Meteor.publish('interpro',function(){
	//return Interpro.find();
})

Meteor.publish('tracks',function(){
	return Tracks.find({});
});
