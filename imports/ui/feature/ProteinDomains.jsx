import React from 'react';
import { scaleLinear } from 'd3-scale';
import { groupBy } from 'lodash';
import ReactResizeDetector from 'react-resize-detector';

import { getGeneSequences } from '/imports/api/util/util.js';
/*
Medtr1g004960
Medtr1g004980
Medtr1g004990
Medtr1g006490
Medtr1g006590
Medtr1g006600
Medtr1g006605
Medtr1g006660
Medtr1g006690
 */

const XAxis = ({ scale, numTicks, transform, seqid }) => {
  const range = scale.range();

  const [start, end] = scale.domain();

  const stepSize = Math.round((end - start) / numTicks);

  const ticks = [start];

  for (let i = 1; i < numTicks; i++) {
     ticks.push(start + (i * stepSize));
  }
  ticks.push(end)
  return (
    <g className = 'x-axis' transform={transform}>
      <text className='axis-label' x={range[0]} y='0' dy='5' textAnchor='left' fontSize='11'>{seqid}</text>
      <line className='backbone' x1={range[0]} x2={range[1]} y1='25' y2='25' stroke='black'/>
      {
        ticks.map((tick, tickIndex) => {
          const pos = scale(tick)
          let textAnchor;
          if (tickIndex === 0){
            textAnchor = 'start';
          } else if (tickIndex === ticks.length - 1){
            textAnchor = 'end';
          } else {
            textAnchor = 'middle';
          }
          return (
            <g className='tick' key={tick}>
              <line x1={pos} x2={pos} y1='20' y2='25' stroke='black' />
              <text x={pos} y='10' dy='5' textAnchor={textAnchor} fontSize='10'>{ tick }</text>
            </g>
          )
        })
      }
    </g>
  )
}

const SourceGroup = ({source, domains, transform, scale}) => {
  return (
    <g transform={transform}>
      {
        domains.map((domain, domainIndex) => {
          return <rect 
            x={scale(domain.start)}
            width={scale(domain.end) - scale(domain.start)}
            y='0'
            height='8'
            rx='4'
            ry='4'
            key={`${domain.name}${domainIndex}`} 
            style={{
              fill: 'white',
              stroke:'black',
              strokeWidth: 1,
              fillOpacity: .5
            }}/>
        })
      }
    </g>
  )
}

const InterproGroup = ({interproId, sourceGroups, transform, scale}) => {
  //const label = typeof interproId !== 'undefined' ? interproId : 'Unintegrated signature';
  const label = interproId;
  return (
    <g transform={transform}>
      <foreignObject width='400' height='30' x='0' y='-30'>
        <a href="#" className="badge badge-dark">{label}</a>
      </foreignObject>
      {
        Object.entries(sourceGroups).map((domainGroup, sourceIndex) => {
          const [source, domains] = domainGroup;
          return <SourceGroup 
            key={source}
            source={source}
            domains={domains}
            transform={`translate(0,${sourceIndex * 10})`}
            index={sourceIndex}
            scale={scale} />
        })
      }
    </g>
  )
}

export default class ProteinDomains extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      width: 100
    }
  }

  onResize = width => {
    this.setState({
      width
    })
  }

  render(){
    const sequences = getGeneSequences(this.props.gene);
    const transcripts = this.props.gene.subfeatures.filter(sub =>  sub.type == 'mRNA');
    const transcript = transcripts.filter(transcript => transcript.ID.endsWith('1'))[0];
    const transcriptSequence = sequences.filter(seq => seq.ID === transcript.ID)[0]
    const transcriptSize = transcriptSequence.pep.length;
    
    const interproGroups = Object.entries(groupBy(transcript.protein_domains, 'interpro'));
    const totalGroups = interproGroups.length;
    let totalDomains = 0;
    const sortedDomains = interproGroups.map(domainGroup => {
      const [ interproId, domains ] = domainGroup;
      const sourceGroups = Object.entries(groupBy(domains, 'name'));
      totalDomains += sourceGroups.length;
      return sourceGroups
    })

    const margin = {
      top: 10,
      bottom: 10,
      left: 20,
      right: 20
    }

    const svgWidth = this.state.width - margin.left - margin.right;
    const svgHeight = (totalGroups * 30) + ( totalDomains * 10 ) + margin.top + margin.bottom + 40;
    const scale = scaleLinear().domain([0, transcriptSize]).range([0, svgWidth])
    let domainCount = 0;
    console.log(interproGroups)
    return (
      <div className="card protein-domains">
        <svg 
          width={svgWidth} 
          height={svgHeight}
          style={{
            marginLeft: margin.left,
            marginTop: margin.top
          }} >
          <XAxis scale={scale} numTicks={5} transform='translate(0,10)' seqid={transcript.ID}/>
          <g className='domains' transform='translate(0,40)'>
          {
            interproGroups.map((domainGroup, index) => {
              const [interproId, domains] = domainGroup;
              const sourceGroups = groupBy(domains, 'name');
              const yTransform = ((index + 1) * 30) + (domainCount * 10);
              const transform = `translate(0,${yTransform})`;
              domainCount += Object.entries(sourceGroups).length;
              return <InterproGroup 
                key={interproId} 
                interproId={interproId} 
                sourceGroups={sourceGroups} 
                transform={transform}
                scale={scale} />
            })
          }
          </g>
        </svg>
        <ReactResizeDetector handleWidth onResize={this.onResize} />
      </div>
    )
  }
}