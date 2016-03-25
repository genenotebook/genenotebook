Template.genemodel.rendered = function(){
	var children = this.data.children;
	var _id = this.data._id._str;

	//select the div to plot in, set min max and margins
	var vis = this.find('#' + _id + '.genemodel');
	var margin = {top: 5, right: 25, bottom: 0, left: 10};
    var width = $('#' + _id).width() - margin.left - margin.right;
    var height = 40 - margin.top - margin.bottom;
    
    //get transcript subfeatures
    var subs = Genes.find({'ID':{$in:children},'type':'CDS'},{fields:{start:1,end:1,_id:0}}).fetch();
	var coords = subs.map(function(x){return [x.start,x.end]});
	var merged = [].concat.apply([],coords)
   
    //set transcript min and max values
    var start = Math.min(...merged);
    var end = Math.max(...merged);
    var mid = Math.round(start + ((end - start) / 2));

	//setup x scale 
	var xScale = d3.scale.linear()
						.domain([start,end])
						.range([0,width])

    //select container and make svg element
    var container = d3.select(vis).append('svg')
    								.attr('height',height + margin.top + margin.bottom)
    								.attr('width',width + margin.left + margin.right)
    								.attr('transform','translate('+margin.left+','+margin.top+')')
    
	//plot backbone line
	var line = container.append('line')
						.style('stroke','black')
						.attr('x1',20)
						.attr('x2',width)
						.attr('y1',height / 8)
						.attr('y2',height / 8)

    //plot exons
    var exons = container.selectAll('rect').data(subs)
    exons.enter()
		.append('rect')
		.attr('x',function(d){  
			//console.log(xScale(d.start))
			return xScale(d.start)
		})
		.attr('y',0)
		.attr('width',function(d){
			//console.log(xScale(d.end) - xScale(d.start))
			return xScale(d.end) - xScale(d.start)
		})
		.attr('height',height / 4)
		.style('fill','red')

    //plot axis
    var xAxis = d3.svg.axis()
    					.tickFormat(d3.format('d'))
    					//.ticks(2)
    					.tickValues([start,mid,end])
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
		width = $('#' + _id).width() - margin.left - margin.right;
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
