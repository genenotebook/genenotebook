import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
//import ReactDOM from 'react-dom';
//import { OverlayTrigger } from 'react-bootstrap';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import ReactResizeDetector from 'react-resize-detector';
//import { Manager, Reference, Popper } from 'react-popper';
import { scaleLinear } from 'd3-scale';
import randomColor from 'randomcolor';
import Color from 'color';

import './genemodel.scss'

const XAxis = ({ scale, numTicks, transform, seqid }) => {
  const formatNumber = new Intl.NumberFormat().format;

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
        <text x={range[0]} y='-10' dy='5' textAnchor='left' fontSize='10'>{ formatNumber(start) }</text>
      </g>
      {
        ticks.map(tick => {
          const pos = scale(tick)
          return (
            <g key={tick}>
              <line x1={pos} x2={pos} y1='0' y2='5' stroke='black' />
              <text x={pos} y='-10' dy='5' textAnchor='middle' fontSize='10'>{ formatNumber(tick) }</text>
            </g>
          )
        })
      }
      <g>
        <line x1 = {range[1]} x2 = {range[1]} y1 = '0' y2 = '5' stroke='black'/>
        <text x={range[1]} y='-10' dy='5' textAnchor='end' fontSize='10'>{ formatNumber(end) }</text>
      </g>
      <text x={range[0]} y='15' dy='5' textAnchor='left' fontSize='11'>{seqid}</text>
    </g>
  )
}

//const Exon = ({ genomeId, geneId, type, start, end, scale, attributes }) => {
class Exon extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showPopover: false
    }
  }

  togglePopover = () => {
    this.setState({
      showPopover: !this.state.showPopover
    })
  }

  render(){
    const { genomeId, start, end, type, scale, attributes, ID, seq } = this.props;
    const { showPopover } = this.state;

    const exonId = `${type}-${start}-${end}`;

    const baseColor = new Color(randomColor({ seed: genomeId + genomeId.slice(3) }));
    const contrastColor = baseColor.isLight() ? 
      baseColor.darken(0.5).saturate(0.3) : 
      baseColor.lighten(0.5).desaturate(0.3);

    const fill = type === 'CDS' ? baseColor : contrastColor;
    const x = scale(start);
    const width = scale(end) -  scale(start);
    const y = type === 'CDS' ? 0 : 4;
    const height = type === 'CDS' ? 12 : 4;
    return <React.Fragment>
      <rect className='exon' key={exonId} {...{x, y, width, height, fill: fill.rgb()}} 
            id={exonId} onClick={this.togglePopover} />
      <Popover placement='top' isOpen={showPopover} 
        target={exonId} toggle={this.togglePopover}>
        <PopoverHeader>
          { ID }
        </PopoverHeader>
        <PopoverBody>
          { `${type}..${start}..${end}` }
          <hr />
          { seq }
        </PopoverBody>
      </Popover>
    </React.Fragment>
  }
}

const Transcript = ({ transcript, exons, scale, strand, genomeId, geneId }) => {
  //put CDS exons last so they get drawn last and are placed on top
  exons.sort((exon1,exon2) => {
    return exon1.type === 'CDS' ? 1 : -1
  })

  //flip start and end coordinates based on strand so that marker end is always drawn correctly
  const x1 = scale(strand === '+' ? transcript.start : transcript.end);
  const x2 = scale(strand === '+' ? transcript.end : transcript.start);
  
  const y1 = 6;
  const y2 = 6;

  return (
    <React.Fragment>
      <line {...{ x1, x2, y1, y2 }} stroke='black' markerEnd='url(#arrowEnd)' />
      {
        exons.map(exon => <Exon key={exon.ID} {...{ genomeId, geneId, scale, ...exon }} /> )
      }
    </React.Fragment>
  )
}

const GenemodelGroup = ({gene, transcripts, width, scale}) => {
  return (
    <g className='genemodel'>
      {
        transcripts.map((transcript,index) => {
          const exons = gene.subfeatures.filter(subfeature => subfeature.parents.indexOf(transcript.ID) >= 0)
          const { ID: geneId, strand, genomeId } = gene;
          return (
            <g key={index} className='transcript' transform={`translate(0,${index * 14})`} >
              <Transcript {...{ exons, transcript, scale, geneId, genomeId, strand}} />
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
      width: 250
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
            transform={`translate(0,${ 12 * transcripts.length + 18})`}
            seqid={gene.seqid}/>
          <defs>
            <marker id='arrowEnd' markerWidth='15' markerHeight='10' refX='0' refY='5' orient='auto'>
              <path d='M0,5 L15,5 L10,10 M10,0 L15,5' fill='none' stroke='black' strokeWidth='1'/>
            </marker>
          </defs>
        </svg>
        { 
          resizable && <ReactResizeDetector handleWidth onResize={this.onResize}  />
        }
      </div>
    )
  }
}
