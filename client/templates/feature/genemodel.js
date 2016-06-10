Template.genemodel.rendered = function(){
	const transcripts = this.data.filter(function(x){return x.type === 'mRNA'});
	const transcriptIds = transcripts.map(function(x){return x.ID});
	console.log(transcripts);
	const strand = transcripts[0].strand;

	//select the div to plot in, set min max and margins
	const vis = this.find('.genemodel');
	const margin = {top: 5, right: 25, bottom: 0, left: 10};
    var width = $('.genemodel').width() - margin.left - margin.right;
    const height = (transcripts.length * 40) - margin.top - margin.bottom;
    
    //get transcript subfeatures, duplicate subs with multiple parents
	const _subs = this.data.filter(function(x){return x.type === 'CDS'})
	const subs = []
	for (var i in _subs){
		var _sub = _subs[i];
		for (var j in _sub.parents){
			parent = _sub.parents[j];
			var sub = jQuery.extend({},_sub);
			sub.parents = parent;
			subs.push(sub)
		};
	};

	//const coords = subs.map(function(x){return [x.start,x.end]});
	//const merged = [].concat.apply([],coords)
   
    //set transcript min and max values
    const starts = transcripts.map(function(x){return x.start});
    const ends = transcripts.map(function(x){return x.end});
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const mid = Math.round(min + ((max - min) / 2));

	//setup x scale 
	const xScale = d3.scale.linear()
						.domain([min,max])
						.range([0,width])

    //select container and make svg element
    const container = d3.select(vis).append('svg')
    								.attr('height',height + margin.top + margin.bottom)
    								.attr('width',width + margin.left + margin.right)
    								.attr('transform','translate('+margin.left+','+margin.top+')')
    
	//plot backbone line
	const line = container.selectAll('line').data(transcripts)
	line.enter()
		.append('line')
		.style('stroke','black')
		.attr('x1',function(d,i){
			return xScale(d.start)
		})
		.attr('x2', function(d,i){
			return xScale(d.end)
		})
		.attr('y1', function(d,i){
			return (i + 1) * 20
		})
		.attr('y2',function(d,i){
			return (i + 1) * 20
		})

    //plot exons
    const exons = container.selectAll('rect').data(subs)
    exons.enter()
		.append('rect')
		.attr('x',function(d){  
			//console.log(xScale(d.start))
			return xScale(d.start)
		})
		.attr('y',function(d){
			const i = transcriptIds.indexOf(d.parents);
			return ((i + 1) * 20) - 5
		})
		.attr('width',function(d){
			//console.log(xScale(d.end) - xScale(d.start))
			return xScale(d.end) - xScale(d.start)
		})
		.attr('height',10)
		.style('fill','red')

    //plot axis
    var xAxis = d3.svg.axis()
    					.tickFormat(d3.format('d'))
    					//.ticks(2)
    					.tickValues([min,mid,max])
    					.orient('top')
    					.scale(xScale);
    var xAxisGroup = container.append('g')
    								.attr('class','x axis')
    								.attr('transform','translate(0,'+height+')')
    								.call(xAxis)
    							.selectAll('text')
    								//.attr('dy','2em')
    								.attr('transform','rotate(0)')
    								.style('text-anchor','start')

	function update(){
		//console.log('update');
		width = $('.genemodel').width() - margin.left - margin.right;
		container.attr("width", width);
		xScale.range([20,width - 20])
		exons.attr('x',function(d){
			return xScale(d.start)
		})
		.attr('width',function(d){
			return xScale(d.end) - xScale(d.start);
		})
		line.attr('x2',width - 20)
		xAxis.scale(xScale)
		container.select('g.x.axis').call(xAxis)
	}
	
	$(window).resize(function() {
		update()
	}).trigger("resize");

 };
