Meteor.publish("genes", function () {
	return Genes.find({},{
		sort: {
			'start':1,
			'end':1,
			'ID':1
		}
	});
});


/*
return Genes.find({
  $or: [
  { private: {$ne: true} },
  { owner: this.userId }
  ]
});
});
*/
/*
Meteor.publishComposite('genes',{
	find: function(){
		return Genes.find({'type':'gene'});
	},
	children: [
	{
		find: function(gene){
			return Genes.find({'ID':{$in: gene.children}});
		},
		children: [
		{
			find: function(transcript){
				return Genes.find({'ID':{$in: transcript.children}});
			}
		}]
	}]
});
*/