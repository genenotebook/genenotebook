const spawn = Npm.require('child_process').spawn;
const Future = Npm.require('fibers/future');
const parseString = xml2js.parseString;
//const xml2js = Npm.require('xml2js');


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
			child.stdout.setEncoding('utf8');
			child.stderr.setEncoding('utf8');
			child.stdin.write(fasta[dbtype]);
			child.stdin.end();
			child.stdout.on('data', function (data) {
			    console.log('stdout: ' + data);
			});
			child.stderr.on('data',function(data){
				console.log('stderr: ' + data)
			})
			child.on('close',function(code){
				console.log('exit code: ' + code)
			})
			Tracks.update({'track':track},{ '$set' : {['blastdbs.' + dbtype] : track + '.' + dbtype } } )
		}
	},
	blast: function(blastType,query,trackNames){
		this.unblock();
		const fut = new Future();
		
		const dbType = DB_TYPES[blastType]
		
		const tracks = Tracks.find({'track':{$in:trackNames} },{fields:{'blastdbs':1}}).fetch();
		
		const dbs = tracks.map(function(x){return x.blastdbs[dbType]}).join(' ')
		
		console.log('blastType:',blastType)
		console.log('dbType:',dbType)
		console.log('dbs:',dbs)
		
		const child = spawn(blastType,['-db',dbs,'-outfmt','5','-num_alignments','20'])
		
		child.stdin.setEncoding('utf8')
		child.stdout.setEncoding('utf8')
		child.stderr.setEncoding('utf8')
		
		child.stdin.write(query)
		
		let out = ''
		child.stdout.on('data',function(data){
			out += data
			//console.log('stdout: ' + data)
		})

		child.stderr.on('data',function(data){
			console.log('stderr: ' + data)
		})

		const o = child.on('close',function(code){
			console.log('exit code: ' + code)
			json_out = parseString(out,function(err,res){
				fut.return(res)
				//console.log(res)
			});
			//fut.return(json_out)
		})

		child.stdin.end()
		return fut.wait()
		
	}
})