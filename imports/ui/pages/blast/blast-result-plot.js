import { Template } from 'meteor/templating';

import d3 from 'd3';
import { interpolateGreys } from 'd3-scale-chromatic';

import './blast-result-plot.html';

 
Template.blastResultPlot.rendered = function(){
	const barheight = 12;
	console.log(this.data)
	const queryLength = this.data.BlastOutput['BlastOutput_query-len'][0];
	const iterations = this.data.BlastOutput.BlastOutput_iterations
	const iteration = iterations[0].Iteration[0].Iteration_hits
	const hits = iteration[0].Hit
	const lines = hits.map(function(hit){
		const hsps = hit.Hit_hsps[0].Hsp
		const starts = hsps.map(function(hsp){
			return hsp['Hsp_query-from'];
		});
		const ends = hsps.map(function(hsp){
			return hsp['Hsp_query-to']
		});
		const start = Math.min(...starts)
		const end = Math.max(...ends)
		return [start,end]
	})

	const maxBitScore = hits[0].Hit_hsps[0].Hsp[0]['Hsp_bit-score'][0];

	const margin = {top: 25, right: 10, bottom: 50, left: 10};
	var width = $('.blast-result-plot').width() - margin.left - margin.right;
	var height = ( hits.length * barheight ) - margin.top

	const xScale = d3.scaleLinear()
			.domain([0,queryLength])
			.range([0,width])

	const tooltip = d3.select('body').append('div')
			.attr('class','tooltip')
			.style('opacity',0);

	var svg = d3.select('.blast-result-plot').append('svg')
			.attr('width',width + margin.left + margin.right)
			.attr('height',height + margin.top + margin.bottom)
		.append('g')
			.attr('class','container')
			.attr('transform','translate(' + margin.left + ',' + margin.top + ')')

	var hit = svg.selectAll('.hit')
			.data(hits)
		.enter().append('g')
			.attr('class','hit')
			.attr('transform',function(d,i){
				return 'translate(0,' + (i * barheight) + ')'
			})

	var backLines = hit.selectAll('line')
			.data(function(hit){
				const hsps = hit.Hit_hsps[0].Hsp
				const starts = hsps.map(function(hsp){
					return hsp['Hsp_query-from'];
				});
				const ends = hsps.map(function(hsp){
					return hsp['Hsp_query-to']
				});
				const start = Math.min(...starts)
				const end = Math.max(...ends)
				return [[start,end]]
			})
		.enter().append('line')
			.attr('x1',function(d){ return xScale(d[0]) })
			.attr('x2',function(d){ return xScale(d[1]) })
			.attr('y1',3.5)
			.attr('y2',3.5)
			.style('stroke','grey')
			.style('stroke-width',2)
			.style('opacity',0.9)

	var hsps = hit.selectAll('rect')
			.data(function(hit){
				var hitDef = hit.Hit_def[0].split(' ')[1];
				hit.Hit_hsps.forEach(function(hsps){
					hsps.Hsp.forEach(function(hsp){
						hsp.Hit_def = hitDef
					})
				})
				return hit.Hit_hsps[0].Hsp
			})
		.enter().append('rect')
			.attr('x',function(d){
				return xScale(d['Hsp_query-from'])
			})
			.attr('width',function(d){
				return xScale(d['Hsp_query-to'] - d['Hsp_query-from'])
			})
			.attr('y',0)
			.attr('height',7)
			.on('mouseover',function(d){
				tooltip.transition()
					.duration(100)
					.style('opacity',.9)
				tooltip.html(d.Hit_def + '<br/>')
					.style('left',(d3.event.pageX - 28) + 'px')
					.style('top',(d3.event.pageY - 30) + 'px')
			})
			.on('mouseout',function(d){
				tooltip.transition()
					.duration(500)
					.style('opacity',0)
			})
			.on('click',function(d){
				$('html','body').animate({
					scrollTop: $('#' + d.Hit_def).offset().top
				},800)
			})
			.style('fill',function(d){
				const bitScore = d['Hsp_bit-score'];
				return interpolateGreys(bitScore / maxBitScore)
			})
			.style('opacity',1)
			.style('stroke','black')
			.style('stroke-width',0.5)

	var xAxis = d3.axisTop(xScale)
			.ticks(10)
			//.tickArguments([4,'s'])
			.tickPadding(5)

	var xAxisGroup = svg.append('g')
			.attr('class','x axis')
			.attr('transform','translate(0,-5)')
			.call(xAxis)
		.selectAll('text')
			//.attr('dy','2em')
			.attr('transform','rotate(0)')
			.style('text-anchor','start')
/*
	var svg = d3.select('.blast-result-plot').selectAll('svg')
			.data(hits)
		.enter().append('svg')
			.attr('width',width + margin.left + margin.right)
			.attr('height',10)
			.attr('transform','translate(0,' + margin.top + ')')
		//.append('g')
			//.attr('transform','translate(0,0)');

	var hsps = svg.selectAll('rect')
			.data(function(d){
				var hitDef = d.Hit_def[0].split(' ')[1];
				d.Hit_hsps.forEach(function(x){
					x.Hsp.forEach(function(h){
						h.Hit_def = hitDef
					})
				})
				return d.Hit_hsps
			})
		.enter().append('rect')
			.attr('x',function(d){
				return d.Hsp[0]['Hsp_hit-from']
			})
			.attr('width',function(d){
				return d.Hsp[0]['Hsp_query-to'] - d.Hsp[0]['Hsp_query-from']
			})
			.attr('y',0)
			.attr('height',7)
			.on('mouseover',function(d){
				console.log(d)
				tooltip.transition()
					.duration(100)
					.style('opacity',.9)
				tooltip.html(d.Hsp[0].Hit_def + '<br/>')
					.style('left',(d3.event.pageX) + 'px')
					.style('top',(d3.event.pageY + 28) + 'px')
			})
			.on('mouseout',function(d){
				tooltip.transition()
					.duration(500)
					.style('opacity',0)
			})
	var xAxis = d3.axisTop(xScale)
    xAxis.tickArguments([4,'s']).tickPadding(3)
    
    //var xAxisGroup = d3.select('.blast-result-plot').append('svg').append('g')
    //var xAxisGroup = svg.append('g')
			.attr('class','x axis')
			.attr('transform','translate(0,0)')
			.call(xAxis)
		.selectAll('text')
			//.attr('dy','2em')
			.attr('transform','rotate(0)')
			.style('text-anchor','start')
*/	

}