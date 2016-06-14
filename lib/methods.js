if (Meteor.isServer){
	const spawn = Npm.require('child_process').spawn;
	const DB_TYPES = {	
		'blastn':'nucl',
		'tblastn':'nucl',
		'tblastx':'nucl',
		'blastp':'prot',
		'blastx':'prot'
	}
	function makeFasta(track){
		const genes = Genes.find({'track':track},{fields:{'ID':1,'subfeatures':1},limit:100000});
		const fastaProt = [];
		const fastaNucl = [];
		genes.forEach(function(gene){
			let transcripts = gene.subfeatures.filter(function(x){return x.type === 'mRNA'})
			for (let transcript of transcripts){
				const fastaHeader = '>' + gene.ID + ' ' + transcript.ID + '\n'
				fastaProt.push(fastaHeader + transcript.pep + '\n')
				fastaNucl.push(fastaHeader + transcript.seq + '\n')
			}
		})
		const fasta = {'prot':fastaProt.join('\n') + '\n',
						'nucl':fastaNucl.join('\n') + '\n'}
		return fasta
	}

	Meteor.methods({
		makeBlastDb: function(track){
			this.unblock();
			const dbtypes = ['nucl','prot'];

			for (let dbtype of dbtypes) {
				const fasta = makeFasta(track)
				const out = track + '.' + dbtype
				const child = spawn('makeblastdb',['-dbtype',dbtype,'-title',out,'-out',out]);
				const pid = child.pid;
				child.stdin.setEncoding('utf8');
				child.stdout.on('data', function (data) {
				    child.stdin.write(fasta[dbtype]);
				    console.log(data.toString());
				});
				child.stderr.on('data',function(data){
					console.log('err')
					console.log(data.toString())
				})
				Tracks.update({'track':track},{ '$set' : {['blastdbs.' + dbtype] : track + dbtype } } )
			}
		},
		blast: function(seq,track,blast){
			this.unblock();
			const dbtype = DB_TYPES[blast];
			const db = Tracks.findOne({'track':track},{fields:{'blastdbs':1}});
			console.log(db)
			//const child = spawn('blast')
		}
	})
}

/*
Meteor.startup(function () {
    const exec = Npm.require('child_process').exec;
});

function test(callback){
    setTimeout(function(){
        cb(null, 'Dummy result');
    },
    100);
}

runCmd = Meteor.wrapAsync(exec);

Meteor.methods({
  test: function(){
    const result = runCmd('readlink -f .');
    console.log(result);  
  }
})
*/