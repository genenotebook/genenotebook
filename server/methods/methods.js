const spawn = Npm.require('child_process').spawn;
const Future = Npm.require('fibers/future');
const parseString = xml2js.parseString;

/**
 * Keep track of what blast commands should use which databases
 * @type {Object}
 */
const DB_TYPES = {	
	'blastn':'nucl',
	'tblastn':'nucl',
	'tblastx':'nucl',
	'blastp':'prot',
	'blastx':'prot'
}

/**
 * format gene info into fasta format
 * @param  {[type]}
 * @return {[type]}
 */
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
	/**
	 * If all data of a single gene is being viewed use this method instead of a publication. 
	 * (This is because aggregation in a publication is not reactive and problematic in various
	 * other ways)
	 * @param  {[type]}
	 * @return {[type]}
	 */
	getSingleGeneData(geneId){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'user')){
			throw new Meteor.Error('not-authorized');
		}
		console.log('getSingleGeneData', geneId)
		const roles = Roles.getRolesForUser(this.userId);
		const visibleSamples = Experiments.find({ permissions: { $in: roles } }, { _id: 1 }).fetch()
		const sampleIds = visibleSamples.map( (sample) => { return sample._id })

		const fut = new Future();

		let genes = Genes.aggregate([
				{ $match: { ID: geneId } },
				{ $addFields: { 
					expression: { 
						$filter: { 
							input: '$expression', 
							as: 'sample', 
							cond: { $in: ['$$sample.experimentId',sampleIds] }
						}
					}
				}
			}
		],(err,res) => {
			if (err){
				fut.throw(err)
			} else {
				fut.return(res)
			}
		})

		let data = fut.wait()
		return data[0]
	},
	queryCount (search,query){
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
	/**
	 * Spin up a child process to construct a blast database
	 * @param  {[type]}
	 * @return {[type]}
	 */
	makeBlastDb (track){
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
	/**
	 * Spin up a child process to run blast
	 * @param  {[type]}
	 * @param  {[type]}
	 * @param  {[type]}
	 * @return {[type]}
	 */
	blast (blastType,query,trackNames){
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
	/**
	 * Map/reduce on all genes and their attributes to identify attribute keys which will be able for filtering
	 * @return {[type]}
	 */
	scanFeatures (){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		this.unblock();
		//meteor requires async code to be run in a fiber/future
		const fut = new Future();

		//put the future that will hold the mapreduce output in the meteor environment, this will be used as callback for the mapreduce
		const mapReduceCallback = Meteor.bindEnvironment(function(err,res){
				if (err){
					fut.throw(err)
				} else {
					fut.return(res)
				}
			} 
		)

		//mapreduce to find all keys for all genes, this takes a while
		a = Genes.rawCollection().mapReduce(
			function(){
				//map function
				let keys = Object.keys(this.attributes) 
				for (let i = 0; i < keys.length; i++){
					emit(keys[i],null) 
				}
			},
			function(key,values){
				//reduce function
				return null
			},
			{ out: { inline: 1 } }, //output options
			mapReduceCallback
		)


		//let the future wait for the mapreduce to finish
		const mapReduceResults = fut.wait();

		//process mapreduce output and put it in a collection
		mapReduceResults.forEach( (feature) => { 
			let name = feature._id
			FilterOptions.findAndModify({ 
				query: { ID: name }, 
				update: { $setOnInsert: { name: name, query: `attributes.${name}`, show: true, canEdit: false } }, 
				new: true, 
				upsert: true 
			}) 
		})
		//add the viewing and editing option, since this key is dynamic it will not allways be present on any gene, but we do want to filter on this
		const permanentOptions = ['viewing','editing','expression']
		permanentOptions.forEach(function(optionId){
			FilterOptions.findAndModify({
				query: { ID: optionId },
				update: { $setOnInsert: { name: optionId, query: optionId, show: true, canEdit: false } }, 
				new: true, 
				upsert: true 
			})
		})
		
	},
	removeFromViewing (geneId){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		Genes.update({ 'ID': geneId },{ $pull: { 'viewing': this.userId } })
		const viewing = Genes.findOne({'ID': geneId}).viewing
		if ( viewing.length === 0 ){
			Genes.update({ 'ID': geneId },{ $unset: { 'viewing': 1 } } )
		} 
	},
	/**
	 * Block a gene from being edited, this should happen when someone is editing a gene to prevent simultaneous edits
	 * @param  {[type]}
	 * @return {[type]}
	 */
	lockGene (geneId) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		Genes.update({ 'ID': geneId },{ $set: { editing: this.userId } })
	},
	/**
	 * This unlocks a gene from being blocked during editing. 
	 * A gene should only be unlocked by the person that locked it
	 * @param  {[type]}
	 * @return {[type]}
	 */
	unlockGene (geneId) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		const gene = Genes.findOne({ ID: geneId })
		if (!gene){
			throw new Meteor.Error('not-authorized')
		}
		console.log(gene.editing)
		if (gene.editing === this.userId){
			Genes.update({ ID: geneId },{ $unset: { editing: 1 } })
		}
	}
})