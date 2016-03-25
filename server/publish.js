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

Meteor.publishComposite('genes',function(limit){
	var limit = limit || 20;
	return {
		find: function(){
			return Genes.find({'type':'gene'},{limit:limit,sort:{'ID':1}});
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
	//if (scaffold === undefined){
	//	scaffold = Genes.findOne({'track':track}).seqid;
	//}
	console.log(track,seqid,start,end);
	//var track = track || 'PanWU01x14_asm01_ann01'
	//var seqid = seqid || 'PanWU01x14_asm01_scf00001'
	//var start = start || 10000;
	//var end = end || 100000;
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

Meteor.publish('tracks',function(){
	//console.log(Tracks.findOne());
	return Tracks.find();
});
