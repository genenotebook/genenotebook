import d3 from 'd3';

Template.genemodel.rendered = function()  {
  const gene = this.data;
  let config = {
    color: {
      'CDS': '#3690c0',
      'exon': 'lightblue',
      'five_prime_UTR': 'grey',
      'three_prime_UTR': 'grey'
    },
    size: {
      'CDS': 10,
      'exon': 5,
      'five_prime_UTR': 5,
      'three_prime_UTR': 5
    },
    spacing: 5,
    drawSubfeatures: ['CDS','exon','three_prime_UTR','five_prime_UTR']
  }
  config.maxSize = Math.max(...Object.values(config.size))
  config.midLine = config.maxSize + config.spacing

  const transcriptData = gene.subfeatures.filter( (sub) => {
    return sub.type === 'mRNA'
  });

  const strand = gene.strand;

  //select the div to plot in, set min max and margins
  const margin = {top: 0, right: 25, bottom: 20, left: 10};
    var width = $('.genemodel').width() - margin.left - margin.right;
    const height = (transcriptData.length * 20) + margin.top + margin.bottom;
    
    //get transcript subfeatures, duplicate subs with multiple parents
  const _subs = gene.subfeatures.filter( (sub) => {
    return config.drawSubfeatures.indexOf(sub.type) >= 0
  })

  const splitSubs = _subs.map( (sub) => {
    return sub.parents.map( (parent) => {
      _sub = $.extend({},sub)
      _sub.parents = parent
      return _sub
    })
  })

  const groupedSubs = _.groupBy([].concat(...splitSubs),'parents')
  const plotData = d3.values(groupedSubs).map((transcript) => {
    return transcript.sort((exon1,exon2) => {
      if (exon1.type === 'exon'){
        return -1
      } else {
        return 1
      }
    })
  })

    //get transcript min and max values
    const starts = transcriptData.map( (x) => {return x.start});
    const ends = transcriptData.map( (x) => {return x.end});
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    
  //setup x scale 
  const xScale = d3.scaleLinear()
      .domain([min - ((max - min) / 10),max + ((max - min) / 10)])
      .range([0,width])

    //select container and make svg element
    const svg = d3.select('#' + gene.ID.replace(/\./g,'\\.') ).append('svg')
      .attr('height',height + margin.top + margin.bottom)
      .attr('width',width + margin.left + margin.right)
    .append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
  
  const trackHeight = config.maxSize + (2 * config.spacing)
  //make svg groups per transcript
  const transcripts = svg.selectAll('.transcript')
      .data(d3.values(groupedSubs))
    .enter().append('g')
      .attr('class','transcript')
      .attr('transform', (d,i) => {
        return 'translate(0,' + i * trackHeight + ')'
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
      .data( (exons) => {
        const t = {}
        const exonStarts = exons.map( (exon) => { return exon.start })
        const exonEnds = exons.map( (exon) => { return exon.end })
        const transcriptStart = Math.min(...exonStarts)
        const transcriptEnd = Math.max(...exonEnds)
        t.start = transcriptStart
        t.end = transcriptEnd
        t.ID = exons[0].parents
        return [t]
      })
    .enter().append('line')
      .attr('x1', (d) => {
        if (strand === '+') {
          return xScale(d.start)
        } else {
          return xScale(d.end)
        }
      })
      .attr('x2', (d) => {
        if (strand === '+'){
          return xScale(d.end) 
        } else {
          return xScale(d.start) 
        }
      })
      .attr('y1',config.midLine)
      .attr('y2',config.midLine)
      .attr('marker-end','url(#arrow)')
      .style('stroke','black')

    //plot exons
    const exons = transcripts.selectAll('rect')
        .data( (exon) => {
          return exon
        })
      .enter().append('rect')
      .attr('x', (exon) => {  
        return xScale(exon.start)
      })
      .attr('y',(exon) => {
        return config.midLine - ( config.size[exon.type] / 2 )
      })
      .attr('width',(exon) => {
        return xScale(exon.end) - xScale(exon.start)
      })
      .attr('height',(exon) => {
        return config.size[exon.type]
      })
      .style('fill',(exon) => {
        return config.color[exon.type]
      })
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

  let update = () => {
    width = $('.genemodel').width() - margin.left - margin.right;
    svg.attr("width", width);
    xScale.range([0,width])
    exons.attr('x', (d) => {
      return xScale(d.start)
    })
    .attr('width', (d) => {
      return xScale(d.end) - xScale(d.start);
    })
    line.attr('x2', (d) => { 
      if (strand === '+'){
        return xScale(d.end) + 10
      } else {
        return xScale(d.start) - 10
      } 
    })
    xAxis.scale(xScale)
    svg.select('g.x.axis').call(xAxis)
  }
  
  $(window).resize(() => {
    update()
  }).trigger("resize");

 };
