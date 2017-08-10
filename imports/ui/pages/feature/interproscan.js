import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import d3 from 'd3';
import lodash from 'lodash';
import { schemeSet3 } from 'd3-scale-chromatic';

import InterPro from '/imports/api/genes/interpro_collection.js';

import './interproscan.html';
import './interproscan.js';

_ = lodash;

Meteor.subscribe('interpro');

function getInterproId(d){
	let interpro;
    let found = false;
	dbxref = d.dbxref.split(',');
	for (let dbString of dbxref){
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

function getInterproMetaData(groupedData){
    const interproIds = Object.keys(groupedData)
    const unintegrated = interproIds.indexOf('Unintegrated');
    if (unintegrated > 0){
        interproIds.splice(unintegrated,1)
    }
    if (interproIds.length !== 0){
        const ipr = Interpro.find().fetch();
        const groupedIpr = _.groupBy(ipr,function(i){ return i.ID })
        const flattenedIpr = _.mapValues(groupedIpr,function(val){ return val[0] })
        return flattenedIpr
    } 
}


Template.interproscan.helpers({
    transcripts : function(){
        return this.subfeatures.filter(function(x){return x.type === 'mRNA'})
    },
    domains:function(){
        return Interpro.find({'ID':{$in:this.domains.InterPro}})
    }
})

Template.interproscan.rendered = function(){
    const transcript = this.data.subfeatures.filter(function(x){return x.type === 'mRNA'})[0];
    const id = transcript.ID;
    const data = _.values(transcript.interproscan).sort(function(a,b){return a.start-b.start});
    const groupedData = _.groupBy(data,function(d){return getInterproId(d)})
    const interproMetaData = getInterproMetaData(groupedData)
    const DataArray = _.values(groupedData)

    const groupedDataArray = DataArray.map(function(domain){
        let domainObj = _.groupBy(domain,function(d){return d.source})
        let domainList = _.values(domainObj)
        return domainList
    })

    const lineHeight = 10;
    const nameSpacing = 140

    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    var width = $('.interproscan').width() - margin.left - margin.right;
    var height = (lineHeight * data.length) - margin.top

    //set min and max values
    var start = 0;
    var end = transcript.seq.length;

    //setup x scale 
    var xScale = d3.scaleLinear()
            .domain([0,end])
            .range([nameSpacing,width])

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
            .tickPadding(-height - margin.top - margin.bottom - 20)
            .tickSize(height + margin.top + margin.bottom)

    svg.append('g')
            .attr('class','x axis')
            .attr('transform','translate(0,10)')
            .call(xAxis)
        .selectAll('text')
            .attr('transform','rotate(0)')
            .style('text-anchor','start')

    //make domain groups
    let domainCounter = 0
    var domains = svg.selectAll('.domain')
            .data(groupedDataArray)
        .enter().append('g')
            .attr('class','domain')
            .attr('transform',function(d,i){
                domainCounter += d.length
                return 'translate(0,' + (((domainCounter - d.length) * (lineHeight + 10)) + 15) + ')'
            })

    var sources = domains.selectAll('.source')
            .data(function(source){
                return source
            })
        .enter().append('g')
            .attr('class','source')
            .attr('transform',function(d,i){
                return 'translate(0,' + i * lineHeight + ')'
            })
    //draw domains
    var rect = sources.selectAll('rect')
            .data(function(domain){
                return domain
            })
        .enter().append('rect')
            .attr('x',function(d){
                return xScale(d.start * 3)
            })
            .attr('width',function(d){
                return xScale(d.end * 3) - xScale(d.start * 3)
            })
            .attr('y',function(d,i){
                return 0//i * 15
            })
            .attr('height',7)
            .attr('rx',2)
            .attr('ry',2)
            .each(function(d,i){
                //initialize bootstrap popover for every rect, bootstrap popup dismissal is automatically taken care of by code in client/main/app-body.js
                $(this).popover({
                    title:d.name,
                    html:true,
                    content:function(){
                        let content = 'Source: ' + d.source + '<br>'
                        if (d.signature_desc) {
                            content += 'Description: ' + d.signature_desc
                        }
                        return content
                    },
                    container:$('#interproscan'),
                    placement:'top'
                })
            })
            .style('fill',function(d){
                let interpro = getInterproId(d)
                if (interpro !== 'Unintegrated'){
                    return interproMetaData[interpro].color
                } else {
                    return 'grey'
                }
            })
            .style('opacity',1)
            .style('stroke','black')
            .style('stroke-width',0.5)
    //add domain names
    var domainIds = domains.selectAll('foreignObject')
            .data(function(domain){
                return [domain[0][0]]
            })
        .enter().append('foreignObject')
            .attr('x',0)
            .attr('y',0)
            .html(function(d){
                let ipr = getInterproId(d)
                return '<button type="button" class="btn btn-default btn-xs">' + ipr + '</button>'
            })
    /*
    var names = domains.selectAll('text')
            .data(function(domain){
                console.log(domain)
                return [domain[0][0]]
            })
        .enter().append('text')
            .attr('x',0)
            .attr('y',10)
            .text(function(d){ 
                let ipr = getInterproId(d)
                if (ipr === 'Unintegrated'){
                    return 'Unintegrated'
                } else {
                    return ipr + ' ' + interproMetaData[ipr].description
                }
            })
    */

    
    function update(){
        width = $('.interproscan').width() - margin.left - margin.right;
        xScale.range([nameSpacing,width])
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

