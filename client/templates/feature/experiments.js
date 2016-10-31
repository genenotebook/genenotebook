import d3 from 'd3';
import { schemeSet3 } from 'd3-scale-chromatic';

Template.experiments.rendered = function(){
	const experiments = this.data.experiments;
	const transcript = this.data.subfeatures.filter(function(x){return x.type === 'mRNA'})[0]
	let maxTpm = 0;
	experiments.forEach(function(x){
		let sample = Experiments.findOne({'_id':x.experiment_id})
		x.exp = sample.experiment;
		x.sample = sample.ID;
		x.description = sample.description;
		maxTpm = Math.max(maxTpm,x.tpm);
	})

	maxTpm = Math.round(maxTpm) + Math.max(1,(maxTpm / 10));

	const data = _.groupBy(experiments,function(x){return x.exp})
	const dataArray = _.values(data);
    const experimentNames = _.keys(data);

	let margin = {top: 10, right: 10, bottom: 100, left: 30};
    let width = $('.experiments').width() - margin.left - margin.right;
    let height = 250 - margin.bottom - margin.top;

    let barWidth = 40;
    let maxBars = 20;

    //setup y scale 
    let yScale = d3.scaleLinear()
            .domain([0,maxTpm])
            .range([height,0])

    let xScale = d3.scaleLinear()
        .domain([0,Math.min(width / barWidth,maxBars)])
        .range([0,Math.min(barWidth * maxBars,width)])

    let svg = d3.select('.experiments').append('svg')
    	.attr('width', width + margin.left + margin.right)
    	.attr('height', height + margin.top + margin.bottom)
    	.append('g')
    	.attr('class','container')
    	.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

    let bars = svg.selectAll('g')
    	.data(dataArray).enter()
    		.append('g')
    		.attr('transform',function(d,i){
    			return 'translate(' + (i + 1)  * barWidth + ',0)'
    		})

    let points = bars.selectAll('circle')
    	.data(function(d){
    		return d
    	})
    	.enter().append('circle')
    	.attr('cy',function(d){
    		return yScale(d.tpm);
    	})
    	.attr('r',5)

    let yAxis = d3.axisLeft(yScale)
            .ticks(4)
            //.tickArguments([4,'s'])
            .tickPadding(20)
            //.tickSize(height + margin.top + margin.bottom)

    let xAxis = d3.axisBottom(xScale)
            .ticks(dataArray.length)
            .tickFormat(function(index){
                return experimentNames[index];
            })

    svg.append('g')
            .attr('class','y axis')
            .call(yAxis)
        .selectAll('text')
            .attr('transform','rotate(0)')
            .style('text-anchor','start')

    svg.append('g')
            .attr('class','x axis')
            .attr('transform','translate(0,' + (height + 10) + ')')
            .call(xAxis)
        .selectAll('text')
            .attr('transform','translate(30,5)rotate(-65)')
            .style('text-anchor','end')
};





