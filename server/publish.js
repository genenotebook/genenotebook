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

Meteor.publish('genes',function(limit,search,query){
	var limit = limit || 40;
	var query = query || {};
	if (search) {
		query.$or = [{'ID':{$regex:search}},{'attributes.Name':{$regex:search}}];
		if (!query.hasOwnProperty('attributes.Productname')){
			query.$or.push({'attributes.Productname':{$regex:search}})
		}
	}
	//var filter = { ID: { '$in': [ 'PanWU01x14_asm01_ann01_000020' ] } }
	/*
	var filter = { 'ID': 
{ '$in': 
[ 'PanWU01x14_asm01_ann01_341930',
'PanWU01x14_asm01_ann01_290290',
'PanWU01x14_asm01_ann01_149940',
'PanWU01x14_asm01_ann01_238370',
'PanWU01x14_asm01_ann01_336460',
'PanWU01x14_asm01_ann01_311230',
'PanWU01x14_asm01_ann01_303100',
'PanWU01x14_asm01_ann01_286650',
'PanWU01x14_asm01_ann01_361860',
'PanWU01x14_asm01_ann01_112910',
'PanWU01x14_asm01_ann01_009920',
'PanWU01x14_asm01_ann01_109330',
'PanWU01x14_asm01_ann01_355570',
'PanWU01x14_asm01_ann01_351290',
'PanWU01x14_asm01_ann01_342460',
'PanWU01x14_asm01_ann01_128430',
'PanWU01x14_asm01_ann01_085220',
'PanWU01x14_asm01_ann01_365040' ] } }
	*/
	console.log(query)
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

Meteor.publish('userList',function(){
	return Meteor.users.find({});
})

Meteor.publish('interpro',function(){
	//return Interpro.find();
})

Meteor.publish('tracks',function(){
	return Tracks.find({});
});
