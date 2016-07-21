Meteor.subscribe('orthogroups')

Template.orthogroup.helpers({
	orthogroup:function(){
		return Orthogroups.findOne({'ID':this.orthogroup})
	},
	alignment: function(orthogroup){
		const alignment = orthogroup.alignment
		const headers = alignment.map(function(x){ 
			let header = x.header.split('&#46;').join('.')
			return header
		})
		const longestHeader = Math.max(...headers.map(function(header){return header.length}))
		const paddedHeaders = headers.map(function(header){
			let paddingLength = (longestHeader - header.length) + 1;
			let padding = '\xA0'.repeat(paddingLength);
			return header + padding
		})
		const sequences = alignment.map(function(x){return x.sequence})
		const zipped = _.zip(paddedHeaders,sequences)
		const merged = zipped.map(function(x){return x[0] + x[1] })

		return merged
	},
	alignmentScore: function(orthogroup){
		const alignment = orthogroup.alignment
		//only take the sequences
		const sequences = alignment.map(function(x){return x.sequence})

		//alignment is square, so length is equal to length of first sequence
		const alignmentLength = sequences[0].length
		
		//arbitrary cutoff
		const cutoff = 0.8;

		//empty sequence lengths array, will contain sequencelengths without gaps
		const seqLengths = Array(sequences.length).fill(0)

		//informative characters
		let infoChars = 0

		//first loop over column index, characters
		for (var charIndex = 0;charIndex < alignmentLength;charIndex++){
			//get current character/column for every sequence
			let char = sequences.map(function(seq){return seq[charIndex]})
			
			//gaps per character
			let gaps = 0

			//then loop over row index, sequences
			for (var c in char){
				if (char[c] === '-'){
					gaps += 1
				} else {
					seqLengths[c] += 1
				}
			}

			//pecentage gaps should be below threshold
			if ((gaps / char.length) < 1 - cutoff) {
				infoChars += 1
			}
		}
		//calucalte the average sequence length
		//from http://stackoverflow.com/questions/10359907/array-sum-and-average
		const avgSeqLength = seqLengths.reduce(function(sum,a){ return sum + a },0) / (sequences.length || 1)

		return (infoChars / avgSeqLength).toFixed(3)
	}
})