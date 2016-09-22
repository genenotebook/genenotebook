import d3 from 'd3';

Template.genemodel.helpers({
	scaffold:function(){
		console.log(this)
		return this.data.seqid
	}
})

Template.genemodel.rendered = function(){
	const barHeight = 20;

	const transcriptData = this.data.subfeatures.filter(function(x){return x.type === 'mRNA'});

	const strand = this.data.strand;

	//select the div to plot in, set min max and margins
	const margin = {top: 0, right: 25, bottom: 20, left: 10};
    var width = $('.genemodel').width() - margin.left - margin.right;
    const height = (transcriptData.length * 20) + margin.top + margin.bottom;
    
    //get transcript subfeatures, duplicate subs with multiple parents
	const _subs = this.data.subfeatures.filter(function(x){return x.type === 'CDS'})
	const splitSubs = _subs.map(function(sub){
		return sub.parents.map(function(parent){
			_sub = $.extend({},sub)
			_sub.parents = parent
			return _sub
		})
	})
	const groupedSubs = _.groupBy([].concat(...splitSubs),'parents')
	//console.log(d3.values(groupedSubs))

    //get transcript min and max values
    const starts = transcriptData.map(function(x){return x.start});
    const ends = transcriptData.map(function(x){return x.end});
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    
	//setup x scale 
	const xScale = d3.scaleLinear()
			.domain([min - ((max - min) / 10),max + ((max - min) / 10)])
			.range([0,width])

    //select container and make svg element
    const svg = d3.select('.genemodel').append('svg')
			.attr('height',height + margin.top + margin.bottom)
			.attr('width',width + margin.left + margin.right)
		.append('g')
			.attr('transform','translate('+margin.left+','+margin.top+')')

	//make svg groups per transcript
	const transcripts = svg.selectAll('.transcript')
			.data(d3.values(groupedSubs))
		.enter().append('g')
			.attr('class','transcript')
			.attr('transform',function(d,i){
				return 'translate(0,' + i * barHeight + ')'
			})

	//define arrowhead
	const defs = svg.append('defs')
			.append('marker')
				.attr('id','arrow')
				.attr('refX',1)
				.attr('refY',5)
				.attr('markerWidth',10)
				.attr('markerHeight',10)
				.attr('orient','auto')
			.append('path')
				.attr("d", "M 0 0 L 10 5 L 0 10 L 0 0")
				.attr("class","arrowHead")
				.style('fill','none')
				.style('stroke','black')
	
	//plot backbone line
	const line = transcripts.selectAll('line')
			.data(function(exons){
				const t = {}
				const exonStarts = exons.map(function(exon){ return exon.start })
				const exonEnds = exons.map(function(exon){ return exon.end })
				const transcriptStart = Math.min(...exonStarts)
				const transcriptEnd = Math.max(...exonEnds)
				t.start = transcriptStart
				t.end = transcriptEnd
				t.ID = exons[0].parents
				return [t]
			})
		.enter().append('line')
			.attr('x1',function(d){
				if (strand === '+') {
					return xScale(d.start)
				} else {
					return xScale(d.end)
				}
			})
			.attr('x2', function(d){
				if (strand === '+'){
					return xScale(d.end) 
				} else {
					return xScale(d.start) 
				}
			})
			.attr('y1',15)
			.attr('y2',15)
			.attr('marker-end','url(#arrow)')
			.style('stroke','black')

    //plot exons
    const exons = transcripts.selectAll('rect')
    		.data(function(d){
    			return d
    		})
    	.enter().append('rect')
			.attr('x',function(d){  
				return xScale(d.start)
			})
			.attr('y',10)
			.attr('width',function(d){
				return xScale(d.end) - xScale(d.start)
			})
			.attr('height',10)
			.style('fill','#3690c0')
			.style('stroke','black')
			.style('stroke-width',0.5)

    //plot axis
    var xAxis = d3.axisBottom(xScale)
    		//.ticks(5)
    		.tickValues([min,(min + max) / 2,max])
    		.tickPadding(5)

    var xAxisGroup = svg.append('g')
			.attr('class','x axis')
			.attr('transform','translate(0,' + height + ')')
			.call(xAxis)
		.selectAll('text')
			.attr('transform','rotate(0)')
			.style('text-anchor','start')

	function update(){
		width = $('.genemodel').width() - margin.left - margin.right;
		svg.attr("width", width);
		xScale.range([0,width])
		exons.attr('x',function(d){
			return xScale(d.start)
		})
		.attr('width',function(d){
			return xScale(d.end) - xScale(d.start);
		})
		line.attr('x2',function(d){ 
			if (strand === '+'){
				return xScale(d.end) + 10
			} else {
				return xScale(d.start) - 10
			} 
		})
		xAxis.scale(xScale)
		svg.select('g.x.axis').call(xAxis)
	}
	
	$(window).resize(function() {
		update()
	}).trigger("resize");

 };
