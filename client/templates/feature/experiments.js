import d3 from 'd3';
import { schemeSet3 } from 'd3-scale-chromatic';

Session.setDefault('selection',[])

function jitter(min, max) {
  return Math.random() * (max - min) + min;
}

Template.experiments.helpers({
    experiments: function(){
        this.experiments.forEach(function(exp){
            let sample = Experiments.findOne({'_id':exp.experiment_id})
            exp.exp = sample.experiment;
            exp.sample = sample.ID;
            exp.description = sample.description;
        })
        const data = _.groupBy(this.experiments,function(x){return x.exp})
        return _.map(data,function(val,key){return {exp:key,samples:val}})
    }
})

Template.experiments.rendered = function(){

    $('.selectpicker').selectpicker({
      style: 'btn-default',
      size: 5,
      title:'Select experiments'
    });


	let experiments = this.data.experiments;
    const selection = Session.get('selection')
    if (selection.length){
         let experiments = experiments.filter(function(exp){
            return (selection.indexOf(exp.exp) > -1) 
        })
    }
	const transcript = this.data.subfeatures.filter(function(x){return x.type === 'mRNA'})[0]
	const maxTpm = Math.max(...experiments.map(function(experiment){ return experiment.tpm }))
   
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

    let experimentGroups = svg.selectAll('g')
    	.data(dataArray).enter()
    		.append('g')
    		.attr('transform',function(d,i){
    			return 'translate(' + (i + 1)  * barWidth + ',0)'
    		})

    let bars = experimentGroups.selectAll('rect')
        .data(dataArray)
        .enter().append('rect')
        .attr('x',- (barWidth / 2))
        .attr('width',barWidth)
        .attr('y',-10)
        .attr('height',height + 25)
        .attr('fill','#3690c0')
        .attr('fill-opacity','0')
        .on('mouseover',function(){
            d3.select(this)
                .attr('fill-opacity','0.5')
        })
        .on('mouseout',function(){
            d3.select(this)
                .attr('fill-opacity','0')
        })
        //.style('fill','#3690c0')

    let points = experimentGroups.selectAll('circle')
    	.data(function(d){
    		return d
    	})
    	.enter().append('circle')
        .attr('cx',function(){
            const jitterWidth = 0.1;
            return jitter(-(barWidth * jitterWidth),(barWidth * jitterWidth))
        })
    	.attr('cy',function(d){
    		return yScale(d.tpm);
    	})
    	.attr('r',5)
        .on('mouseover',function(d){
            d3.select(this)
                .attr('r',7)
                .style('cursor','pointer')
            experimentGroups.selectAll('circle')
                .sort(function(a,b){
                    if (a.experiment_id._str === d.experiment_id._str){
                        return 1
                    } else {
                        return -1
                    }
                })
        })
        .on('mouseout',function(){
            d3.select(this)
                .attr('r',5)
                .style('cursor','default')
        })
        .each(function(d,i){
            //initialize bootstrap popover for every circle, bootstrap popup dismissal is automatically taken care of by code in client/main/app-body.js
            $(this).popover({
                title:d.exp,
                html:true,
                content:function(){
                    let content = 'Tpm: ' + d.tpm.toFixed(2) + '<br>'
                    content += 'Raw counts: ' + d.counts + '<br>'
                    content += 'Description: ' + d.description
                    
                    return content
                },
                container:$('#experiments'),
                placement:'top'
            })
        })


    let yAxis = d3.axisLeft(yScale)
            .ticks(4)
            //.tickArguments([4,'s'])
            .tickPadding(20)
            //.tickSize(height + margin.top + margin.bottom)

    let xAxis = d3.axisBottom(xScale)
            .ticks(experimentNames.length)           
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





