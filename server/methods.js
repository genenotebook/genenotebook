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
	queryCount:function(search,query){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		if (search) {
			query.$or = [{ 'ID': { $regex: search , $options: 'i' } },{ 'Name': { $regex: search , $options: 'i' } }];
			if (!query.hasOwnProperty('Productname')){
				query.$or.push({ 'Productname': { $regex: search , $options: 'i' } })
			}
		}
		const count = Genes.find(query).count()
		return count
	},
	makeBlastDb: function(track){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		this.unblock();
		const dbtypes = ['nucl','prot'];

		for (let dbtype of dbtypes) {
			const fasta = makeFasta(track)
			const outFile = track + '.' + dbtype
			const child = spawn('makeblastdb',['-dbtype',dbtype,'-title',out,'-out',outFile]);
			const pid = child.pid;
			child.stdin.setEncoding('utf8');
			child.stdout.setEncoding('utf8');
			child.stderr.setEncoding('utf8');
			child.stdin.write(fasta[dbtype]);
			child.stdin.end();
			
			let out = ''
			child.stdout.on('data', function (data) {
			    out += data;
			});
			let err = ''
			child.stderr.on('data',function(data){
				err += data;
			})

			if (err){
				console.log('ERROR:\n' + err)
			}

			child.on('close',function(code){
				console.log('makeblastdb exit code: ' + code)
				console.log(out)
			})
			Tracks.update({'track':track},{ '$set' : {['blastdbs.' + dbtype] : track + '.' + dbtype } } )
		}
	},
	blast: function(blastType,query,trackNames){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		this.unblock();
		const fut = new Future();
		
		const dbType = DB_TYPES[blastType]
		
		const tracks = Tracks.find({'track':{$in:trackNames} },{fields:{'blastdbs':1}}).fetch();
		
		const dbs = tracks.map(function(track){return track.blastdbs[dbType]}).join(' ')
		
		const child = spawn(blastType,['-db',dbs,'-outfmt','5','-num_alignments','20'])
		
		child.stdin.setEncoding('utf8')
		child.stdout.setEncoding('utf8')
		child.stderr.setEncoding('utf8')
		
		child.stdin.write(query)
		
		let out = ''
		let err = ''
		child.stdout.on('data',function(data){
			out += data;
		})

		child.stderr.on('data',function(data){
			err += data;
		})

		if (err){
			console.log(err);
		}

		const o = child.on('close',function(code){
			console.log('exit code: ' + code)
			json_out = parseString(out,function(err,res){
				fut.return(res)
			});
		})

		child.stdin.end()
		return fut.wait()
	},
	'scan.features':function(){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		a = Genes.mapReduce(function(){for (var key in this){emit(key,null) }},function(key,values){return null},{out:{inline:1}})
		console.log(a)
		a.results.forEach(function(i){ FilterOptions.findAndModify({ query:{_id:i._id}, update:{$setOnInsert:{show:true,canEdit:false}}, new:true, upsert:true }) })
	}
})