import d3 from 'd3';
import { schemeSet3 } from 'd3-scale-chromatic';

Meteor.subscribe('orthogroups');

function parseNewick(a){
	//Copyright 2011 Jason Davies https://github.com/jasondavies/newick.js
	for(var e=[],r={},s=a.split(/\s*(;|\(|\)|,|:)\s*/),t=0;t<s.length;t++){
		var n=s[t];switch(n){case"(":var c={};r.children=[c],e.push(r),r=c;break;case",":var c={};e[e.length-1].children.push(c),r=c;break;case")":r=e.pop();break;case":":break;default:var h=s[t-1];")"==h||"("==h||","==h?r.name=n:":"==h&&(r.value=parseFloat(n))}}
		return r
	}

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
	tree: function(orthogroup){
		const treeString = orthogroup.phylogenetic_tree;
		const tree = parseNewick(treeString);
		return tree;
	},
	alignmentScore: function(orthogroup){
		const alignment = orthogroup.alignment
		//only take the sequences
		const sequences = alignment.map(function(x){return x.sequence})

		//alignment is square, so length is equal to length of first sequence
		const alignmentLength = sequences[0].length
		
		//arbitrary cutoff
		const cutoff = 0.5;

		//all nucleotides
		let allNucleotides = 0
		
		//informative nucleotides
		let infoNucleotides = 0

		//loop over column index, characters
		for (var charIndex = 0;charIndex < alignmentLength;charIndex++){
			//get current character/column for every sequence
			let chars = sequences.map(function(seq){return seq[charIndex]})
			
			//get non gap characters
			let nonGapChars = chars.filter(function(c){ if (c !== '-') return c })

			allNucleotides += nonGapChars.length

			if ((nonGapChars.length / chars.length) > cutoff) {
				infoNucleotides += nonGapChars.length
			}
		}
		return (infoNucleotides / allNucleotides).toFixed(3)
	}
})

Template.orthogroup.rendered = function(){
	console.log('orthogroup this',this)
	const ID = this.data.ID + '.1';
	const og = Orthogroups.findOne({'ID':this.data.orthogroup});
	const treeData = parseNewick(og.phylogenetic_tree);
	const hierarchy = d3.hierarchy(treeData)
		.sum(function(d){ return d.value })
		.sort(function(a, b){ return b.height - a.height || b.value - a.value; });

	let margin = {top: 10, right: 10, bottom: 10, left: 20};
    let width = $('.experiments').width() - margin.left - margin.right;
    let height = (og.alignment.length * 20) - margin.bottom - margin.top;


	const cluster = d3.cluster()
		.size([height,width - 200])
		.separation(function(a, b){ return 1 })

	const nodes = cluster(hierarchy).descendants();
	const links = cluster(hierarchy).links();

	let svg = d3.select('.tree').append('svg')
		.attr('height', height + margin.bottom + margin.top)
		.attr('width', width + margin.left + margin.right)

	let chart = svg.append('g')

	let link = chart.append('g')
			.attr('class','links')
		.selectAll('path')
			.data(links)
		.enter().append('path')
			//.each(function(d){ d.target.linkNode = this; })
			.attr('d',function(d){ return  step(d.source.x, d.target.x, d.source.y, d.target.y) })
			.style('stroke','black')
			.style('fill','none')
			.attr('transform','translate(5,0)')

	chart.append('g')
			.attr('class','labels')
		.selectAll('text')
			.data(nodes.filter(function(d){ return !d.children }))
		.enter().append('text')
			//.attr('dy','.10em')
			.attr('class', function(d) {
				if (d.data.name === ID){
					return 'label current'
				} else {
					return 'label'
				}
			})
			.style('text-anchor','start')
			.attr('transform',function(d){ return 'translate(' + ( d.y + 10 ) + ',' + ( d.x + 3 ) +')' })
			.text(function(d){ return d.data.name })

}

function step(startX,endX,startY,endY){
	return 'M' + startY + ',' + startX + ' L' + startY + ',' + endX + ' ' + endY + ',' + endX;
}



