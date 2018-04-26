//import { Template } from 'meteor/templating';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import ReactResizeDetector from 'react-resize-detector';

//import { Popover, OverlayTrigger } from 'react-bootstrap';
import { scaleLinear } from 'd3-scale';

import './genemodel.scss'


const XAxis = ({ scale, numTicks, transform, seqid }) => {
  const range = scale.range();

  const [start, end] = scale.domain();

  const stepSize = Math.round((end - start) / numTicks);

  const ticks = [];

  for (let i = 1; i < numTicks; i++) {
     ticks.push(start + (i * stepSize));
  }

  return (
    <g className = 'x-axis' transform={transform}>
      <line x1={range[0]} x2={range[1]} y1='5' y2='5' stroke='black'/>
      <g>
        <line x1={range[0]} x2={range[0]} y1='0' y2='5' stroke='black'/>
        <text x={range[0]} y='-10' dy='5' textAnchor='left' fontSize='10'>{start}</text>
      </g>
      {
        ticks.map(tick => {
          const pos = scale(tick)
          return (
            <g key={tick}>
              <line x1={pos} x2={pos} y1='0' y2='5' stroke='black' />
              <text x={pos} y='-10' dy='5' textAnchor='middle' fontSize='10'>{ tick }</text>
            </g>
          )
        })
      }
      <g>
        <line x1 = {range[1]} x2 = {range[1]} y1 = '0' y2 = '5' stroke='black'/>
        <text x={range[1]} y='-10' dy='5' textAnchor='end' fontSize='10'>{end}</text>
      </g>
      <text x={range[0]} y='15' dy='5' textAnchor='left' fontSize='11'>{seqid}</text>
    </g>
  )
}


const Transcript = ({transcript, exons, scale, strand}) => {
  //put CDS exons last so they get drawn last and are placed on top
  exons.sort((exon1,exon2) => {
    return exon1.type === 'CDS' ? 1 : -1
  })

  //flip start and end coordinates based on strand so that marker end is always drawn correctly
  const x1 = strand === '+' ? transcript.start : transcript.end;
  const x2 = strand === '+' ? transcript.end : transcript.start;
  
  return (
    <g>
      <line 
        x1={scale(x1)} 
        x2={scale(x2)} 
        y1='5' 
        y2='5' 
        stroke='black'
        markerEnd='url(#arrowEnd)'
      />
      {
        exons.map(exon => {
          return (
            <rect 
              key={exon.ID} 
              x={scale(exon.start)} 
              width={scale(exon.end) - scale(exon.start)} 
              y={exon.type === 'CDS' ? 0 : 2.5} 
              height={exon.type === 'CDS' ? 10 : 5}
              fill={exon.type === 'CDS' ? 'darkorange' : 'brown'}/>
          )
        })
      }
    </g>
  )
}

const GenemodelGroup = ({gene, transcripts, width, scale}) => {
  return (
    <g className='genemodel'>
      {
        transcripts.map((transcript,index) => {
          const exons = gene.subfeatures.filter(subfeature => subfeature.parents.indexOf(transcript.ID) >= 0)
          return (
            <g key={index} className='transcript' transform={`translate(0,${index * 12})`} >
              <Transcript exons={exons} transcript={transcript} scale={scale} strand={gene.strand}/>
            </g>
          )
        })
      }
    </g>
  )
}


export default class Genemodel extends React.PureComponent {
  constructor(props){
    super(props)
    this.state = {
      width: 300
    }
  }

  onResize = width => {
    this.setState({
      width
    })
  }

  render(){
    const gene = this.props.gene;
    const geneLength = gene.end - gene.start;
    const padding = Math.round(.1 * geneLength);
    const start = Math.max(0, gene.start - padding)
    const end = gene.end + padding;

    const transcripts = gene.subfeatures.filter(subfeature => subfeature.type === 'mRNA');

    const scale = scaleLinear().domain([start,end]).range([.05 * this.state.width, .90 * this.state.width])
    return (
      <div id="genemodel-card" className='card genemodel px-0 pb-0'>
        <svg width={this.state.width} height={12 * transcripts.length + 40} className='genemodel-container'>
          <GenemodelGroup gene={gene} transcripts={transcripts} width={this.state.width} scale={scale}/>
          <XAxis 
            scale={scale} 
            numTicks='4' 
            transform={`translate(0,${ 12 * transcripts.length + 15})`}
            seqid={gene.seqid}/>
          <defs>
            <marker id='arrowEnd' markerWidth='15' markerHeight='10' refX='0' refY='5' orient='auto'>
              <path d='M0,5 L15,5 L10,10 M10,0 L15,5' fill='none' stroke='black' strokeWidth='1'/>
            </marker>
          </defs>
        </svg>
        <ReactResizeDetector handleWidth onResize={this.onResize}  />
      </div>
    )
  }
}
