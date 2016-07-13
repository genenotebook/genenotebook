Template.seq.helpers({
	transcripts: function(){
		return this.subfeatures.filter(function(x){return x.type === 'mRNA'})
	}
})