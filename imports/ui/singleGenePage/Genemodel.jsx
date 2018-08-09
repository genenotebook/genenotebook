import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import ReactResizeDetector from 'react-resize-detector';
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

const ExonPopover = ({ showPopover, togglePopover, exonId, ID, type, start, end, phase, attributes, seq }) => {
  return (
    <Popover placement='top' isOpen={showPopover} target={exonId} toggle={togglePopover}>
      <PopoverHeader>
        { ID }
      </PopoverHeader>
      <PopoverBody className='px-0 py-0'>
        <div className="table-responive">
          <table className="table table-hover">
            <tbody>
              <tr>
                <td>Type</td>
                <td>{type}</td>
              </tr>
              <tr>
                <td>Coordinates</td>
                <td>{start}..{end}</td>
              </tr>
              <tr>
                <td>Phase</td>
                <td>{phase}</td>
              </tr>
              {
                Object.keys(attributes).map(attribute => {
                  return <tr key={attribute}>
                    <td>{attribute}</td>
                    <td>{attributes[attribute]}</td>
                  </tr>
                })
              }
              <tr>
                <td colspan='2'>
                  <h6>Exon sequence</h6>
                  <div className="card exon-sequence px-1">
                    { seq }
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PopoverBody>
    </Popover>
  )
}

class Exon extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showPopover: false
    }
  }

  togglePopover = () => {
    console.log(this.props)
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

    const style = { ':hover': { border: '1px solid black'} };

    return <React.Fragment>
      <rect className='exon' {...{ x, y, width, height, fill: fill.rgb() }} 
            id={exonId} onClick={this.togglePopover} />
      <ExonPopover exonId={exonId} {...this.props} {...this.state} />
    </React.Fragment>
  }
}

const Transcript = ({ transcript, exons, scale, strand, genomeId, geneId }) => {
  //put CDS exons last so they get drawn last and are placed on top
  exons.sort((exon1,exon2) => {
    return exon1.type === 'CDS' ? 1 : -1
  })

  const { start, end } = transcript;

  const transcriptId = `mRNA_${start}_${end}`;

  //flip start and end coordinates based on strand so that marker end is always drawn correctly
  const x1 = scale(strand === '+' ? start : end);
  const x2 = scale(strand === '+' ? end : start);
  
  const y1 = 6;
  const y2 = 6;

  const t = strand === '+' ? 2 : -2;
  return (
    <React.Fragment>
      <line {...{ x1, x2, y1, y2 }} stroke='black' markerEnd='url(#arrowEnd)' id={transcriptId}/>
      <line {...{ x1: x1 - t, x2: x2 + t, y1, y2 }} className='transcript-hover'  />
      {
        exons.map(exon => <Exon key={exon.ID} {...{ genomeId, geneId, scale, ...exon }} /> )
      }
      {/*<ExonPopover exonId={transcriptId} {...transcript} showPopover={true} />*/}
    </React.Fragment>
  )
}

const GenemodelGroup = ({gene, transcripts, width, scale}) => {
  return (
    <g className='genemodel' transform='translate(0,4)'>
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
        <svg width={this.state.width} height={14 * transcripts.length + 46} className='genemodel-container'>
          <GenemodelGroup gene={gene} transcripts={transcripts} width={this.state.width} scale={scale}/>
          <XAxis 
            scale={scale} 
            numTicks='4' 
            transform={`translate(0,${ 14 * transcripts.length + 22})`}
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
