import React from 'react';
import ContainerDimensions from 'react-container-dimensions'
//import { Popover, OverlayTrigger } from 'react-bootstrap';
import { scaleLinear } from 'd3-scale';
import { interpolateGreys } from 'd3-scale-chromatic';

const PopoverHover = (props) => {
  return (
    <Popover id='blast-plot-popover' title={props.geneID}>
      <p>
        <small>
          <b>E-value</b>: {props.evalue}
          <br/>
          <b>Bitscore</b>: {props.bitScore}
          <br/>
          <b>Alignment length</b>: {props.alignmentLength}
          <br/>
          <b>Gaps</b>: {props.gaps} 
        </small>
      </p>
    </Popover>
  )
}

const XAxis = (props) => {
  const range = props.scale.range();
  const width = range[1];

  const domain = props.scale.domain();
  const queryLength = domain[1];

  const stepSize = Math.round(queryLength / props.numTicks)

  const ticks = [];

  for (let i = 1; i < props.numTicks; i++) {
     ticks.push(i * stepSize);
  }

  return (
    <g className = 'x-axis' transform='translate(0,15)'>
      <line x1='0' x2={width} y1='5' y2='5' stroke='black'/>
      <g>
        <line x1='0' x2='0' y1='0' y2='5' stroke='black'/>
        <text x='0' y='-10' dx='5' dy='5' textAnchor='middle'>0</text>
      </g>
      {
        ticks.map(tick => {
          const pos = props.scale(tick)
          return (
            <g key={tick}>
              <line x1={pos} x2={pos} y1='0' y2='5' stroke='black' />
              <text x={pos} y='-10' dx='5' dy='5' textAnchor='middle'>{ tick }</text>
            </g>
          )
        })
      }
      <g>
        <line x1 = {width} x2 = {width} y1 = '0' y2 = '5' stroke='black'/>
        <text x={width} y='-10' dx='5' dy='5' textAnchor='end'>{queryLength}</text>
      </g>
    </g>
  )
}

const HitPlotLine = (props) => {
  const hsps = props.hit.Hit_hsps;
  const geneID = props.hit.Hit_def[0].split(' ')[1]
  return (
    <g transform={`translate(0,${props.index * props.height})`}>
      {
        hsps.map((_hsp, index) => {
          const hsp = _hsp.Hsp[0];
          const x = hsp['Hsp_query-from']
          const width = hsp['Hsp_query-to'] - x;
          const bitScore = hsp['Hsp_bit-score'];
          const alignmentLength = hsp['Hsp_align-len'];
          const gaps = hsp['Hsp_gaps'];
          const evalue = hsp['Hsp_evalue'];
          return (
              <rect
                key={index} 
                x={props.xScale(x)} 
                y='0' 
                width={props.xScale(width)} 
                height={props.height / 2}
                style={{
                  fill: interpolateGreys(bitScore / props.maxBitScore)
                }} />
          )
        })
      }
    </g>
  )
}

const HitPlot = (props) => {
  const padding = {
    top: 10,
    bottom: 10,
    left: 20,
    right: 20
  }
  const width = props.width - padding.left - padding.right
  const xScale = scaleLinear().domain([0, props.queryLength]).range([0, width])
  const maxBitScore = props.hits[0].Hit_hsps[0].Hsp[0]['Hsp_bit-score'][0];
  const lineHeight = 12;

  const height = ( lineHeight * props.hits.length ) + padding.top + padding.bottom + 30;

  return (
    <svg width = {props.width} height = {height}>
      <g className = 'blast-hit-plot' transform={`translate(${padding.left},${padding.top})`}>
        <XAxis scale = {xScale} numTicks = {10}/>
        <g className = 'hits' transform = 'translate(0,30)'>
          {
            props.hits.map((hit,index) => {
              return (
                <HitPlotLine 
                  key={index} 
                  hit={hit} 
                  index={index} 
                  xScale={xScale}
                  height = {lineHeight}
                  maxBitScore={maxBitScore} />
              )
            })
          }
        </g>
      </g>
    </svg>
  )
}

export default class BlastResultPlot extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    const { blastResult, queryLength, ...props } = this.props;
    const hits = blastResult.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;

    return (
      <div className='blast-result-plot'>
        <ContainerDimensions>
          {
            ({width, height}) => {
              return <HitPlot width = {width} hits = {hits} queryLength = {queryLength}/>
            }
          }
        </ContainerDimensions>
      </div>
    )
  }
}