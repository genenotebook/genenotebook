//Meteor.subscribe('interpro');

function getInterpro(d){
	var interpro;
	dbxref = d.dbxref.split(',');
	for (var i=0;i<dbxref.length;i++){
		db = dbxref[i].split(':')
		if (db[0] === 'InterPro') {
			interpro = db[1]
		}
	}
	return interpro
}

function set_type(data){
	var index = 0
	var name_index = {}
	for (var i in data){
		var d = data[i]
		//console.log(getInterpro(d));
		if (Object.keys(name_index).indexOf(d.name) < 0 ){
			name_index[d.name] = index
			index++
		}
		d.index = name_index[d.name]
	}
	return data
}

function processDomains(data){
    var newData = {}
    var iprIndex = {}
    var totalIndex = {}
    for (var i in data){
        var d = data[i]
        //get interpro ID, or Unintegrated
        var ipr = getInterpro(d);
        if (ipr === undefined){
            ipr = 'Unintegrated';
        }
        //classify domains based on IPR name
        if (Object.keys(newData).indexOf(ipr) < 0){
            newData[ipr] = [d]
        } else {
            newData[ipr].push(d)
        }
        //assign index per IPR classification, domains with identical source get identical index
        if (Object.keys(iprIndex).indexOf(ipr) < 0){
            iprIndex[ipr] = 0
            totalIndex[ipr] = {}
            totalIndex[ipr][d.name] = 0
        } else if (Object.keys(totalIndex[ipr]).indexOf(d.name) < 0){
            totalIndex[ipr][d.name] = iprIndex[ipr]
            iprIndex[ipr]++
        }
        //console.log(totalIndex[ipr][d.name])
        d.index = totalIndex[ipr][d.name]
    }
    return newData
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
    console.log(this.data);
    const transcript = this.data.filter(function(x){return x.type === 'mRNA'})[0];
    const data = _.values(transcript.interproscan).sort(function(a,b){return a.start-b.start});
    var filteredData = processDomains(data);
    var gapHeight = 5;
    var domainHeight = 7;
    //var _id = this.data._id._str;
    var vis = this.find('.interproscan');
    var margin = {top: 10, right: 100, bottom: 20, left: 10};
    var width = $('.interproscan').width() - margin.left - margin.right;
    var coords = data.map(function(x){return [x.start,x.end]})
    var merged = [].concat.apply([],coords)
    var col = d3.scale.category20c();

    //set min and max values
    var start = Math.min(...merged);
    var end = Math.max(...merged);
    var mid = Math.round(start + ((end - start) / 2));

    //setup x scale 
    var xScale = d3.scale.linear()
                        .domain([0,end])
                        .range([0,width])
                        .clamp(true)

    var keys = Object.keys(filteredData).sort(function(a,b){
        if (a === 'Unintegrated'){
            return 1
        } else {
            return 0
        }
    });

    var rects = [];
    var containers = [];

    for (var k in keys){
        var ipr = keys[k]
        var iprInfo = Interpro.findOne({'ID':ipr});
        var domainData = filteredData[ipr]
        var maxIndex = Math.max(...domainData.map(function(x){
            return x.index;
        }))
        var height = ( ( maxIndex + 2) * domainHeight )
        var container = d3.select(vis).append('svg')
            .attr('class',ipr)
            .attr('height',height + margin.top + margin.bottom)
            .attr('width',width + margin.left + margin.right)
            .attr('transform','translate('+margin.left+','+margin.top+')')
        containers.push(container);
        var domain = container.selectAll('g')
            .data(domainData)
            .enter()
            .append('g')
            .attr('transform', function(d, i) { 
                return 'translate(0,' + (( d.index * domainHeight ) + margin.top) + ')'; 
            });
        var rect = domain.append('rect')
            .attr('x',function(d){
                return xScale(d.start)
            })
            .attr('y',function(d,i){
                return domainHeight + (d.index * gapHeight)
            })
            .attr('width',function(d){
                return xScale(d.end) - xScale(d.start)
            })
            .attr('height',domainHeight)
            .attr('rx',2)
            .attr('ry',2)
            .style('fill',function(d){
                return col(k)
            })
        rects.push(rect)
        var text = container.append('text')
            .attr('x',0)
            .attr('y',10)
            .text(function(){
                //console.log(ipr)
                /*
                if (ipr !== 'Unintegrated'){
                    var url = 'http://www.ebi.ac.uk/Tools/dbfetch/dbfetch/interpro/' + ipr + '/tab'
                    Meteor.http.call("GET",url,function(error,result){
                        result.addHeader("Access-Control-Allow-Origin", "http://www.ebi.ac.uk");
                        console.log(result.statusCode);
                    });
                }
                */
                if (iprInfo !== undefined){
                    return ipr + ': ' + iprInfo.name
                } else {
                    return ipr
                }
            })
    }
    function update(){
        width = $('.interproscan').width() - margin.left - margin.right;
        xScale.range([20,width-100])
        for (var i = 0;i < containers.length;i++){
        //for (var r in rects){
            var container = containers[i]
            container.attr("width", width);
            var rect = rects[i]
            rect.attr('x',function(d){
                return xScale(d.start)
            })
            .attr('width',function(d){
                return xScale(d.end) - xScale(d.start);
            })
        }
        //text.attr('x',function(d){
        //    return xScale(d.end)
        //})
        xAxis.scale(xScale)
        //container.select('g.x.axis').call(xAxis)
    }

    $(window).resize(function() {
        update()
    }).trigger("resize");
}

/*

Template.interproscan.rendered = function(){
	var _id = this.data._id._str;
	var data = _.values(this.data.interproscan).sort(function(a,b){return a.start-b.start});
	newData = getDomainTypes(data);
    console.log(newData);
    data = set_type(data);
	var maxIndex = Math.max(...data.map(function(x){return x.index}))
	//console.log(data)
	var col = d3.scale.category20c();
	var domainHeight = 20;

	//select the div to plot in, set min max and margins
	var vis = this.find('#' + _id + '.interproscan');
	var margin = {top: 5, right: 25, bottom: 0, left: 10};
	var width = $('#' + _id).width() - margin.left - margin.right;
	var height = (maxIndex * domainHeight) - margin.top - margin.bottom + (3 * domainHeight) ;
	
	var coords = data.map(function(x){return [x.start,x.end]})
	var merged = [].concat.apply([],coords)

	//set min and max values
	var start = Math.min(...merged);
	var end = Math.max(...merged);
	var mid = Math.round(start + ((end - start) / 2));

	//setup x scale 
	var xScale = d3.scale.linear()
						.domain([0,end])
						.range([0,width])
						.clamp(true)
	//select container and make svg element
	var container = d3.select(vis).append('svg')
		.attr('height',height + margin.top + margin.bottom)
		.attr('width',width + margin.left + margin.right)
		.attr('transform','translate('+margin.left+','+margin.top+')')

	//plot domains
	var domain = container.selectAll('g')
		.data(data)
		.enter()
		.append('g')
		.attr('transform', function(d, i) { 
			return 'translate(0,' + d.index * domainHeight + ')'; 
		});

	var rect = domain.append('rect')
		.attr('x',function(d){
			return xScale(d.start)
		})
		.attr('y',function(d,i){
			return domainHeight
		})
		.attr('width',function(d){
			return xScale(d.end) - xScale(d.start)
		})
		.attr('height',domainHeight / 1.5 )
		.style('fill',function(d){
			return col(d.index)
		})

	var text = domain.append('text')
		.attr('class',function(d){
			if (getInterpro(d) !== undefined){
				return 'interpro_link'
			} else {
				return 'interpro_text'
			}
		})
		.attr('x',function(d){
			return xScale(d.end)
		})
		.attr('dx','-6em')
		.attr('y',domainHeight)
		.attr('dy','.9em')
		.text(function(d){
			var name = getInterpro(d);
			if (name !== undefined){
				return name
			} else 
			return d.name
		}).on('click',function(d){
			var name = getInterpro(d)
			if (name !== undefined){
				window.open('http://www.ebi.ac.uk/interpro/entry/'+name)
			}
		})

	var xAxis = d3.svg.axis()
		.tickFormat(d3.format('d'))
		.tickValues([0,mid,end])
		.orient('top')
		.scale(xScale);
	var xAxisGroup = container.append('g')
		.attr('class','x axis')
		.attr('transform','translate(0,'+height +')')
		.call(xAxis)
        .selectAll('text')
		.attr('transform','rotate(0)')
		.style('text-anchor','start')

	function update(){
		width = $('#' + _id).width() - margin.left - margin.right;
		container.attr("width", width);
		xScale.range([20,width-100])
		rect.attr('x',function(d){
			return xScale(d.start)
		})
		.attr('width',function(d){
			return xScale(d.end) - xScale(d.start);
		})
		text.attr('x',function(d){
			return xScale(d.end)
		})
		xAxis.scale(xScale)
		container.select('g.x.axis').call(xAxis)
	}

	$(window).resize(function() {
		update()
	}).trigger("resize");
 };
 */
