import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/template';
import { Tracker } from 'meteor/tracker';

import './browser.html';
import './browser.scss';


Session.setDefault('seqid','PanWU01x14_asm01_scf00001');
Session.setDefault('start',409500);
Session.setDefault('end',413500);
Session.setDefault('track','PanWU01x14_asm01_ann01')
Tracker.autorun(function(){
	var track = Session.get('track')
	var seqid = Session.get('seqid');
	var start = Session.get('start');
	var end = Session.get('end');
	var zoom = (end - start) / 4;
  Meteor.subscribe('browser',track,seqid,start-zoom,end+zoom);
})

Template.browser.helpers({
	genes : function(){
	},
	start: function(){
		return Session.get('start')
	},
	end: function(){
		return Session.get('end')
	},
	seqid: function(){
		return Session.get('seqid')
	},
	track: function(){
		return Session.get('track')
	}
});

Template.browser.events({
	"submit .new-seqid": function(event){
		event.preventDefault();
		var seqid = event.target.seqid.value;
		Session.set('seqid',seqid);
	},
	"submit .new-start": function(event){
		event.preventDefault();
		var start = parseInt(event.target.start.value);
		Session.set('start',start);
	},
	"submit .new-end": function(event){
		event.preventDefault();
		var end = parseInt(event.target.end.value);
		Session.set('end',end);
	},
	"click .nav#min": function(){
		console.log('min');
		var curStart = Session.get('start');
		var curEnd = Session.get('end');
		var zoom = Math.floor((curEnd - curStart) / 4)
		var newStart = curStart - zoom > 0 ? curStart - zoom : 0;
		var newEnd = curEnd + zoom;
		Session.set('start',newStart);
		Session.set('end',newEnd);
	},
	"click .nav#plus": function(){
		console.log('plus');
		var curStart = Session.get('start');
		var curEnd = Session.get('end');
		var zoom = Math.floor((curEnd - curStart) / 8)
		var newStart = curStart + zoom > 0 ? curStart + zoom : 0;
		var newEnd = curEnd - zoom;
		Session.set('start',newStart);
		Session.set('end',newEnd);
	},
	"click .nav#left": function(){
		console.log('left');
		var curStart = Session.get('start');
		var curEnd = Session.get('end');
		var zoom =Math.floor((curEnd - curStart) / 4)
		var newStart = curStart - zoom > 0 ? curStart - zoom : 0;
		var newEnd = curStart - zoom > 0 ? curEnd - zoom : zoom * 2;
		Session.set('start',newStart);
		Session.set('end',newEnd);
	},
	"click .nav#right": function(){
		console.log('right');
		var curStart = Session.get('start');
		var curEnd = Session.get('end');
		var zoom = Math.floor((curEnd - curStart) / 4)
		var newStart = curStart + zoom;
		var newEnd = curEnd + zoom;
		Session.set('start',newStart);
		Session.set('end',newEnd);
	}
});

Template.browser.onRendered(function(){
    function isOverlapping(x1,x2,y1,y2){
    	if (x1 >= y1 && x1 <= y2){
    		console.log('this')
    		return true
    	} else if (y1 >= x1 && y1 <= x2){
    		console.log('that')
    		return true
    	} else {
    		return false
    	}
    	//return (x2 >= y1 && x1 <= y2)
    	//return Math.max(x1,y1) <= Math.min(y1,y2)
    }
    function setVerticalPosition(genes,subsMap){
    	var processed = [];
    	for (var i = 0;i < genes.length;i++){
    		if (_.contains(processed,i)){
    			console.log('contains')
    			continue
    		};
    		//if (!_.has(genes[i],'placement')){
    			genes[i].placement = 1
    		//};
    		for (var j = 0;j < genes.length;j++){
    			if (i >= j) { 
    				continue 
    			};
    			var gene1 = genes[i]
    			var gene2 = genes[j]
    			var overlap = isOverlapping(gene1.start,gene1.end,gene2.start,gene2.end)
    			console.log(i,j)
    			console.log(overlap,gene1.ID,gene2.ID)
    			if (overlap){
    				processed.push(j)
    				var placement = genes[i].placement + 1
    				genes[j].placement = placement
    				for (sub in genes[j].children){
    					subId = genes[j].children[sub]
    					//console.log(subId)
    					if (Object.keys(subsMap).indexOf(subId) > 0){
    						subsMap[subId].placement = placement
    					}
    				}
    				console.log('overlap',gene1.ID,gene2.ID)
    			}
    		}
    	}
    }
    function getSubsMap(subs){
    	var subsMap = {}
    	for (var sub in subs){
    		var subId = subs[sub].ID
    		subsMap[subId] = subs[sub]
    	}
    	//for (var i = 0;i < subs.length;i++){
    	//	var sub = subs[i]
    	//	subsMap[sub.ID] = sub
    	//}
    	return subsMap
    }
    /*
    var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([140, 0])
			.html(function(d) {
				var text = "<p><strong>ID:</strong> <span>" + d.ID + "</span></p>";
				text += "<p><strong>pos:</strong> <span>" + d.placement + "</span></p>";
				return text;
			})
	*/
	//select container and make svg element
	//select the div to plot in, set min max and margins
	var vis = this.find('.browser');
	var margin = {top: 5, right: 25, bottom: 0, left: 10};
    var width = $('.browser').width() - margin.left - margin.right;
    var height = 200 - margin.top - margin.bottom;

    var container = d3.select(vis).append('svg')
		.attr('height',height + margin.top + margin.bottom)
		.attr('width',width + margin.left + margin.right)
		.attr('transform','translate('+margin.left+','+margin.top+')')
	
	//container.call(tip);

	Tracker.autorun(function(){
		var track = Session.get('track')
		var seqid = Session.get('seqid');
		var start = Session.get('start');
		var end = Session.get('end');
		var zoom = (end - start) / 2;
		var maxZoom = 100000;
		var subs = Genes.find({'type':'CDS','track':track,'seqid':seqid,'end':{$gte:start - zoom},'start':{$lte:end + zoom}}).fetch();
		var genes = Genes.find({'type':'mRNA','track':track,'seqid':seqid,'end':{$gte:start - zoom},'start':{$lte:end + zoom}}).fetch();
		var subsMap = getSubsMap(subs);
		setVerticalPosition(genes,subsMap);
		var _genes = genes.map(function(x){ return [x.ID,x.placement] } )
		//console.log(_genes);
		//setup x scale 
		var xScale = d3.scale.linear()
			.domain([start,end])
			.range([0,width])

		var track = container.append('g')
			.attr('class','track')
			.attr('transform','translate(0,40)')

		//plot backbone line
		var lines = container.select('g.track')
			.selectAll('line')
			.data(function(){
				if (zoom <= maxZoom){
					return genes
				} else {
					return [];
				}
			})

		lines.enter()
			.append('line')
			.style('stroke','black')
			.attr('y1',function(d){ return (d.placement * 10) - 5})
			.attr('y2',function(d){ return (d.placement * 10) - 5})
		lines.transition()
			.duration(2000)
			.attr('x1',function(d){ 
			//console.log(d.placement)
			return xScale(d.start) 
		})
			.attr('x2',function(d){ return xScale(d.end) })
		//plot exon rectangles
	    var exons = container.select('g.track')
	    	.selectAll('rect')
	    	.data(function(){
	    		if (zoom <= maxZoom){
	    			return subs
	    		} else {
	    			return genes
	    		}
	    	})
	    exons.transition()
			.duration(200)
			.attr('x',function(d){ return xScale(d.start) })
			.attr('y',function(d){
				if (d.placement === undefined){
					return 0
				} else {
					return (d.placement) * 10
				}
			})
			.attr('width',function(d){ return xScale(d.end) - xScale(d.start) })

	    exons.enter()
			.append('rect')
		
		exons.exit().remove()
		exons.attr('x',function(d){ return xScale(d.start) })
			.attr('y',function(d){
				if (d.placement === undefined){
					return 0
				} else {
					return (d.placement) * 10
				}
			})
			.attr('width',function(d){ return xScale(d.end) - xScale(d.start) })
			.attr('height',10)
			.style('fill',function(d){
				if (d.strand === '+'){
					return 'red';
				} else {
					return 'blue';
				}
			})

	    var xAxis = d3.svg.axis()
			.tickFormat(d3.format('d'))
			.orient('top')
			.scale(xScale);

	    var xAxisGroup = container.append('g')
			.attr('class','x axis')
			//.attr('transform','translate(0,'+height+')')
			.attr('transform','translate(0,20)')
			.selectAll('text')
			.style('text-anchor','start')
			.transition()
		
		container.select('g.x.axis').call(xAxis)
			
    })
});