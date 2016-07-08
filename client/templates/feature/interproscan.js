import d3 from 'd3';
import { schemeSet3 } from 'd3-scale-chromatic';

function getInterpro(d){
	var interpro;
    var found = false;
	dbxref = d.dbxref.split(',');
	//for (var i=0;i<dbxref.length;i++){
	for (let dbString of dbxref){
    	//db = dbxref[i].split(':')
        let db = dbString.split(':')
		if (db[0] === 'InterPro') {
			interpro = db[1]
            found = true
		}
	}
    if (!found){
        interpro = 'Unintegrated'
    }
	return interpro
}

/*
Template.interproscan.helpers({
    domains : function(){
        var data = _.values(this.data.interproscan).sort(function(a,b){return a.start-b.start});
        var filteredData = processDomains(data);
    }
})
*/

Template.interproscan.rendered = function(){
    const transcript = this.data.filter(function(x){return x.type === 'mRNA'})[0];
    const data = _.values(transcript.interproscan).sort(function(a,b){return a.start-b.start});
    console.log(data)
    const groupedData = _.groupBy(data,'name')
    const groupedDataArray = d3.values(groupedData);

    var lineHeight = 15;

    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    var width = $('.interproscan').width() - margin.left - margin.right;
    var height = (lineHeight * groupedDataArray.length) - margin.top

    //set min and max values
    var start = 0;
    var end = this.data[0].seq.length;

    //setup x scale 
    var xScale = d3.scaleLinear()
            .domain([0,end])
            .range([0,width])
    
    //setup tooltip                    
    const tooltip = d3.select('body').append('div')
            .attr('class','tooltip')
            .style('opacity',0);

    //setup svg
    var svg = d3.select('.interproscan').append('svg')
            .attr('width',width + margin.left + margin.right)
            .attr('height',height + margin.top + margin.bottom + 20)
        .append('g')
            .attr('class','container')
            .attr('transform','translate(' + margin.left + ',' + margin.top + ')')

    //draw axis first, so it sits nicely in the back
    var xAxis = d3.axisBottom(xScale)
            .ticks(10)
            //.tickArguments([4,'s'])
            .tickPadding(-height - margin.top - margin.bottom - 20)
            .tickSize(height + margin.top + margin.bottom)

    svg.append('g')
            .attr('class','x axis')
            .attr('transform','translate(0,10)')
            .call(xAxis)
        .selectAll('text')
            //.attr('dy','2em')
            .attr('transform','rotate(0)')
            .style('text-anchor','start')

    //make domain groups
    var domains = svg.selectAll('.hit')
            .data(groupedDataArray)
        .enter().append('g')
            .attr('class','domain')
            .attr('transform',function(d,i){
                return 'translate(0,' + ((i * lineHeight)  + 15) + ')'
            })

    //draw domains
    var rect = domains.selectAll('rect')
            .data(function(domain){
                console.log(domain)
                return domain
            })
        .enter().append('rect')
            .attr('x',function(d){
                return xScale(d.start * 3)
            })
            .attr('width',function(d){
                return xScale(d.end * 3) - xScale(d.start * 3)
            })
            .attr('y',0)
            .attr('height',7)
            .attr('rx',2)
            .attr('ry',2)
            .on('mouseover',function(d){
                tooltip.transition()
                    .duration(100)
                    .style('opacity',.9)
                tooltip.html(d.name+ '<br/>')
                    .style('left',(d3.event.pageX) + 'px')
                    .style('top',(d3.event.pageY) + 'px')
            })
            .on('mouseout',function(d){
                tooltip.transition()
                    .duration(500)
                    .style('opacity',0)
            })
            .style('fill',function(d){
                const i = Object.keys(groupedData).indexOf(d.name)
                return schemeSet3[i]
            })
            .style('opacity',1)
            .style('stroke','black')
            .style('stroke-width',0.5)
    
    function update(){
        width = $('.interproscan').width() - margin.left - margin.right;
        xScale.range([40,width])
        svg.attr('width',width)
        rect.attr('x',function(d){ 
            return xScale(d.start * 3)
        })
        .attr('width',function(d){
            return xScale(d.end * 3) - xScale(d.start * 3)
        })

        xAxis.scale(xScale)
        svg.select('g.x.axis').call(xAxis)
    }

    $(window).resize(function() {
        update()
    }).trigger("resize");
}

