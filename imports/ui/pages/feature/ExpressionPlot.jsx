import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { mean, sum, groupBy } from 'lodash';

import ContainerDimensions from 'react-container-dimensions';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { scaleLinear } from 'd3-scale';
import Select from 'react-select';

import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';

import './expressionplot.scss';

/**
 * https://stackoverflow.com/a/46854785/6573438
 * @param  {Number} x Number to be rounded
 * @param  {Number} n Floating point precision
 * @return {Number}   Rounded Number
 */
const round = (x, n) => {
  return parseFloat(Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n)
};

class SampleSelect extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <Select value='all'/>
    )
  }
}

const YAxis = ({ scale, numTicks }) => {
  const range = scale.range();
  const [start, end] = scale.domain();
  const precision = end > 10 ? 0 : end > 1 ? 1 : 2;

  const stepSize = (end - start) / numTicks;
  const ticks = [];

  for (let i = 1; i < numTicks; i++) {
     ticks.push(start + (i * stepSize));
  }

  return (
    <g className='y-axis'>
      <line x1='0' x2='0' y1={range[0]} y2={range[1]} stroke='black'/>
      <g>
        <line x1='-5' x2='0' y1={range[0]} y2={range[0]} stroke='black'/>
        <text x='-10' y={range[0]} textAnchor='end' fontSize='10'>{round(start, precision)}</text>
      </g>
      {
        ticks.map(tick => {
          const pos = scale(tick)
          return (
            <g key={tick}>
              <line x1='-5' x2='0' y1={pos} y2={pos} stroke='black' />
              <text x='-10' y={pos} textAnchor='end' fontSize='10'>{ round(tick, precision) }</text>
            </g>
          )
        })
      }
      <g>
        <line x1='-5' x2='0' y1={range[1]} y2={range[1]} stroke='black'/>
        <text x='-10' y={range[1]} textAnchor='end' fontSize='10'>{round(end, precision)}</text>
      </g>
    </g>
  )
}

const DotPlot = ({ samples, yScale }) => {
  return (
    <g className='dotplot'>
    {
      samples.map(sample => {
        return (
          <circle 
            key={sample._id}
            cx='0' 
            cy={ yScale(sample.tpm) }
            r='3'
            stroke='black'
            strokeWidth='1.5'
            fill='white' />
        )
      })
    }
    </g>
  )
}

const BarPlot = ({ samples, yScale }) => {
  const tpm = samples.map( sample => sample.tpm );
  const meanVal = mean(tpm);
  const width = 15;

  const stdDev = Math.sqrt(
    sum(
      samples.map( sample => {
        return Math.pow(sample.tpm - meanVal, 2)
      })
    )
  )

  const stdErr = stdDev / Math.sqrt(samples.length);


  return (
    <g className = 'barplot'>
      <rect 
        x = { -.5 * width }
        width = { width }
        y = { yScale(meanVal) }
        height = { yScale.range()[0] - yScale(meanVal) }
        stroke = 'black'
        fill = '#4eb3d3'  />
      <line
        x1 = '0'
        x2 = '0'
        y1 = { yScale(meanVal - stdErr) }
        y2 = { yScale(meanVal + stdErr) }
        stroke = 'black' />
      <line
        x1 = { -.25 * width }
        x2 = { .25 * width }
        y1 = { yScale(meanVal - stdErr) }
        y2 = { yScale(meanVal - stdErr) }
        stroke = 'black' />
      <line
        x1 = { -.25 * width }
        x2 = { .25 * width }
        y1 = { yScale(meanVal + stdErr) }
        y2 = { yScale(meanVal + stdErr) }
        stroke = 'black' />
    </g>
  )
}

const GroupedSamplePlot = ({ samples, yScale, transform }) => {
  const groupName = samples.map(sample => sample.replicaGroup)[0]
  const range = yScale.range()
  return (
    <g transform={transform}>
      <BarPlot samples={samples} yScale={yScale} />
      <DotPlot samples={samples} yScale={yScale} />
      <g transform={`translate(0,${range[0]})`}>
        <line x1='-20' x2='20' y1='0' y2='0' stroke='black'/>
        <line x1='0' x2='0' y1='0' y2='10' stroke='black'/>
        <text x='5' y='25' textAnchor='left' transform='rotate(30)' fontSize='10'>{groupName}</text>
      </g>
    </g>
  )
}

const GroupedSamples = ({ groups, yScale, transform }) => {
  return (
    <g transform={transform}>
      {
        Object.entries(groups).map((group, index) => {
          const [expGroup, groupSamples] = group;
          return (
            <GroupedSamplePlot 
              key={expGroup} 
              samples={groupSamples} 
              yScale={yScale} 
              transform={`translate(${index * 40},0)`} />
            )
        })
      }
    </g>
  )
}

class ExpressionPlot extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const tpm = this.props.samples.map(sample => sample.tpm)
    tpm.push(1)
    const maxTpm = Math.max(...tpm)
    const precision = maxTpm > 10 ? 0 : maxTpm > 1 ? 1 : 2;
    const yMax = round(maxTpm + .1 * maxTpm, precision);

    const replicaGroups = groupBy(this.props.samples, 'replicaGroup')
    const padding = {
      top: 40,
      bottom: 10,
      left: 50,
      right: 10
    }
    return (
      <div id="expression">
        <hr />
        <h3>Expression</h3>
        <SampleSelect samples={this.props.samples} />
        <div className='card expression-plot'>
          <ContainerDimensions>
          {
            ({width, height}) => {
              const yScale = scaleLinear()
                .domain([0,yMax])
                .range([250 - padding.top - padding.bottom ,0])

              return (
                <svg width={width} height='350'>
                  <g transform={`translate(${padding.left},${padding.top})`}>
                    <YAxis scale={yScale} numTicks='4' />
                    <GroupedSamples groups={replicaGroups} yScale={yScale} transform='translate(20,0)'/>
                  </g>
                </svg>
              )
            }
          }
          </ContainerDimensions>
        </div>
      </div>
    )
  }
}

export default withTracker(props => {
  const gene = props.gene
  const ExperimentInfoSub = Meteor.subscribe('experimentInfo');
  const samples = Transcriptomes.find({ geneId: gene.ID }).fetch();
  samples.forEach(sample => {
    const sampleInfo = ExperimentInfo.findOne({'_id': sample.experimentId})
    Object.assign(sample, sampleInfo)
  })

  return {
    gene: gene,
    samples: samples,
    loading: !ExperimentInfoSub.ready()
  }
})(ExpressionPlot)