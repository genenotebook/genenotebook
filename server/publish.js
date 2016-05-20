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

Meteor.publishComposite('genes',function(limit,search){
	var limit = limit || 40;
	console.log('search: '+search);
	console.log('limit: '+limit);
	return {
		find: function(){
			if (search){
				var results = Genes.find({'type':'gene',$or:[{'ID':search},{'attributes.Name':search}]},{limit:limit,sort:{'ID':1}}).fetch();
				console.log(results);
				return Genes.find({'type':'gene',$or:[{'ID':search},{'attributes.Name':search}]},{limit:limit,sort:{'ID':1}});				
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

//Meteor.publish('users',function(){
//	return Meteor.users.find();
//})

Meteor.publish('interpro',function(){
	//return Interpro.find();
})

Meteor.publish('tracks',function(){
	return Tracks.find();
});
