import React from 'react';
import { scaleLinear } from 'd3-scale';
import { groupBy } from 'lodash';
import ReactResizeDetector from 'react-resize-detector';
import randomColor from 'randomcolor';

import { getGeneSequences } from '/imports/api/util/util.js';


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
          const fill = domain.interpro === 'Unintegrated signature' ? 'grey' : randomColor({seed: domain.interpro});
          return <rect 
            x={scale(domain.start)}
            width={scale(domain.end) - scale(domain.start)}
            y='0'
            height='8'
            rx='4'
            ry='4'
            key={`${domain.name}${domainIndex}`} 
            style={{
              fill: fill,
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
  //const label = interproId;
  const [xMin, xMax] = scale.range();
  const descriptions = new Set();
  Object.entries(sourceGroups).forEach((domainGroup, sourceIndex) => {
    const [source, domains] = domainGroup;
    domains.forEach(domain => {
      if (typeof domain.signature_desc !== 'undefined'){
        descriptions.add(domain.signature_desc)
      }
    })
  })
  const description = [...descriptions][0];
  return (
    <g transform={transform}>
      <foreignObject width={xMax} height='25' x='0' y='-22'>
        <p style={{fontSize: '1rem', fontFamily: 'monospace', overflow: 'hidden', 
          whitespace: 'nowrap', height: 25, textOverflow: 'ellipsis', wordBreak: 'break-all' }}>
          <a href="#" className="btn btn-outline-dark px-2 py-0" style={{fontSize: '.7rem'}}>
            {interproId}
          </a>
          &nbsp;{description}
        </p>
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

const sortGroups = (groupA, groupB) => {
  const [nameA, intervalsA] = groupA;
  const [nameB, intervalsB] = groupB;
  if (nameA === 'Unintegrated signature') {
    return 1
  }
  if (nameB === 'Unintegrated signature'){
    return -1
  }
  const startA = Math.min(...intervalsA.map(interval => interval.start));
  const startB = Math.min(...intervalsB.map(interval => interval.start));

  console.log(startA, startB, startA - startB)

  return startA - startB
}

export default class ProteinDomains extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      width: 300
    }
  }

  static defaultProps = {
    resizable: true
  }

  onResize = width => {
    this.setState({
      width
    })
  }

  render(){
    const { gene, resizable } = this.props;
    //get sequence to determine length
    const sequences = getGeneSequences(gene);
    //interproscan results should be on transcripts
    const transcripts = this.props.gene.subfeatures.filter(sub =>  sub.type == 'mRNA');
    //for now we only look at the primary transcript
    const transcript = transcripts.filter(transcript => transcript.ID.endsWith('1'))[0];
    const transcriptSequence = sequences.filter(seq => seq.ID === transcript.ID)[0]
    const transcriptSize = transcriptSequence.prot.length;
    
    const interproGroups = Object.entries(groupBy(transcript.protein_domains, 'interpro')).sort(sortGroups);
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
      <div className="card protein-domains px-0">
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
              console.log(domainGroup)
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
        { 
          resizable && <ReactResizeDetector handleWidth onResize={this.onResize} />
        }
      </div>
    )
  }
}