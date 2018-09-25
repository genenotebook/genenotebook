import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { compose } from 'recompose';
import { mean, sum, groupBy } from 'lodash';
import randomColor from 'randomcolor';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { scaleLinear } from 'd3-scale';

import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';

import { withEither, round } from '/imports/ui/util/uiUtil.jsx';

import './expressionPlot.scss';

const expressionDataTracker = ({ gene, samples, ...props }) => {
  const transcriptomeSub = Meteor.subscribe('geneExpression', gene.ID);
  const loading = !transcriptomeSub.ready();

  const sampleInfo = groupBy(samples, '_id');
  const sampleIds = samples.map(sample => sample._id);
  
  const values = Transcriptomes.find({
    geneId: gene.ID,
    experimentId: {
      $in: sampleIds
    }
  }).fetch().map(value => {
    Object.assign(value, sampleInfo[value.experimentId][0])
    return value
  });

  return {
    gene,
    values,
    loading
  }
}

const hasNoSamples = ({ samples, ...props }) => {
  return samples.length === 0
}

const NoSamples = () => {
  return <div className="card expression-plot px-1 pt-1 mb-0">
    <div className="alert alert-dark mx-1 mt-1" role="alert">
      <p className="text-center text-muted mb-0">No expression data found</p>
    </div>
  </div>
}

const withConditionalRendering = compose(
  withEither(hasNoSamples, NoSamples),
  withTracker(expressionDataTracker)
)

const ExpressionPopover = ({ showPopover, targetId, togglePopover, ...expression }) => {
  const { tpm, est_counts, description, replicaGroup, sampleName } = expression;
  return <Popover placement='top' isOpen={showPopover} 
    target={targetId} toggle={togglePopover}>
    <PopoverHeader>
      { sampleName }
    </PopoverHeader>
    <PopoverBody className='px-0 py-0'>
      <div className="table-responive">
        <table className="table table-hover">
          <tbody>
            <tr>
              <td>TPM</td>
              <td>{ tpm }</td>
            </tr>
            <tr>
              <td>EST counts</td>
              <td>{ est_counts }</td>
            </tr>
            <tr>
              <td>Description</td>
              <td>{ description }</td>
            </tr>
            <tr>
              <td>Replica group</td>
              <td>{ replicaGroup }</td>
            </tr>
          </tbody>
        </table>
      </div>
    </PopoverBody>
  </Popover>
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

  return <g className='y-axis'>
    <text y='-35' x={(range[1] - range[0]) / 2} fontSize='11' 
      transform='rotate(-90)' textAnchor='middle'>
      TPM
    </text>
    <line x1='0' x2='0' y1={range[0]} y2={range[1]} stroke='black'/>
    <g>
      <line x1='-5' x2='0' y1={range[0]} y2={range[0]} stroke='black'/>
      <text x='-10' y={range[0]} textAnchor='end' fontSize='10'>
        { round(start, precision) }
      </text>
    </g>
    {
      ticks.map(tick => {
        const pos = scale(tick)
        return (
          <g key={tick}>
            <line x1='-5' x2='0' y1={pos} y2={pos} stroke='black' />
            <text x='-10' y={pos} textAnchor='end' fontSize='10'>
              { round(tick, precision) }
            </text>
          </g>
        )
      })
    }
    <g>
      <line x1='-5' x2='0' y1={range[1]} y2={range[1]} stroke='black'/>
      <text x='-10' y={range[1]} textAnchor='end' fontSize='10'>
        { round(end, precision) }
      </text>
    </g>
  </g>
}


class ExpressionDot extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showPopover: false
    }
  }

  togglePopover = () => {
    this.setState({
      showPopover: !this.state.showPopover
    })
  }

  render() {
    const { yScale, ...sample } = this.props;
    const { showPopover } = this.state;
    const targetId = `x${sample._id}`;
    return <React.Fragment>
      <circle className='expression' id={targetId} cx='0' cy={ yScale(sample.tpm) }
        r='4' strokeWidth='1' fill='white' onClick={this.togglePopover} />
      <ExpressionPopover {...{ targetId, showPopover, ...sample }} togglePopover={this.togglePopover} />
    </React.Fragment>
  }
}

const DotPlot = ({ replicaGroup, groupSamples, yScale }) => {
  return <g className='dotplot'>
  {
    groupSamples.map(sample => {
      return <ExpressionDot key={sample._id} {...{ yScale, ...sample }} />
    })
  }
  </g>
}

const BarPlot = ({ replicaGroup, groupSamples, yScale }) => {
  const tpm = groupSamples.map( sample => sample.tpm );
  const meanVal = mean(tpm);
  const width = 20;

  const stdDev = Math.sqrt(
    sum(
      groupSamples.map( sample => {
        return Math.pow(sample.tpm - meanVal, 2)
      })
    )
  );

  const stdErr = stdDev / Math.sqrt(groupSamples.length);

  const fill = randomColor({ seed: replicaGroup });
  const style = { fill, fillOpacity: 0.5 };

  return <g className = 'barplot'>
    <rect className='barplot' x = { -.5 * width } width = { width } style={ style }
      y = { yScale(meanVal) } height = { yScale.range()[0] - yScale(meanVal) }/>
    <line className='stderr' x1 = '0' x2 = '0' y1 = { yScale(meanVal - stdErr) }
      y2 = { yScale(meanVal + stdErr) } stroke = 'black' />
    <line className='stderr' x1 = { -.33 * width } x2 = { .33 * width }
      y1 = { yScale(meanVal - stdErr) } y2 = { yScale(meanVal - stdErr) } stroke = 'black' />
    <line className='stderr' x1 = { -.33 * width } x2 = { .33 * width }
      y1 = { yScale(meanVal + stdErr) } y2 = { yScale(meanVal + stdErr) } stroke = 'black' />
  </g>
}

class GroupedSamplePlot extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      highlight: false
    }
  }

  highlight = () => {
    this.setState({
      highlight: true
    })
  }

  lowlight = () => {
    this.setState({
      highlight: false
    })
  }

  render(){
    const { replicaGroup, groupSamples, yScale, transform } = this.props;
    const { highlight } = this.state;
    const range = yScale.range()
    const highlightStyle = { stroke: 'none', fill: '#d9d9d9' }
    return <g transform={transform} onMouseOver={this.highlight} onMouseOut={this.lowlight} >
      <g transform={`translate(0,${range[0]})`}>
        {
          highlight && <g className='highlight'>
            <rect x={-12.5} width={25} y={-range[0]} height={range[0] + 30} style={ highlightStyle } />
            <rect x={-8} width={100} y={20} height={20} transform='rotate(17,25,20)' style={ highlightStyle } />
          </g>
        }
        <line x1='-20' x2='20' y1='0' y2='0' stroke='black'/>
        <line x1='0' x2='0' y1='0' y2='10' stroke='black'/>
        <text x='5' y='25' textAnchor='left' transform='rotate(17)' fontSize='10'>
          { `${replicaGroup} (n = ${groupSamples.length})` }
        </text>
      </g>
      <BarPlot {...{ replicaGroup, groupSamples, yScale }} />
      <DotPlot {...{ replicaGroup, groupSamples, yScale }} />
    </g>
  }
}

const GroupedSamples = ({ replicaGroups, yScale, transform }) => {
  return <g transform={transform}>
    {
      Object.entries(replicaGroups).map(([replicaGroup, groupSamples], index) => {
        return <GroupedSamplePlot key={replicaGroup} {...{ replicaGroup, groupSamples }} 
            yScale={yScale} transform={`translate(${index * 40},0)`} />
      })
    }
  </g>
}

class ExpressionPlot extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      width: 250
    }
  }

  static defaultProps = {
    resizable: true,
    height: 250
  }

  onResize = width => {
    this.setState({
      width
    })
  }

  render(){
    const { values, resizable, height } = this.props;
    const { width } = this.state;
    const tpm = values.map(value => value.tpm)
    tpm.push(1)
    const maxTpm = Math.max(...tpm)
    const precision = maxTpm > 10 ? 0 : maxTpm > 1 ? 1 : 2;
    const yMax = round(maxTpm + .1 * maxTpm, precision);

    const replicaGroups = groupBy(values, 'replicaGroup');
    const padding = {
      top: 20,
      bottom: 10,
      left: 50,
      right: 10
    };

    const yScale = scaleLinear()
      .domain([0, yMax])
      .range([height - padding.top - padding.bottom, 0]);

    return <div className='card expression-plot'>
      <svg width={width} height={height + 100}>
        <g transform={`translate(${padding.left},${padding.top})`}>
          <YAxis scale={yScale} numTicks='4' />
          <GroupedSamples {...{ replicaGroups, yScale }}
            transform='translate(20,0)'/>
        </g>
      </svg>
      { 
        resizable && <ReactResizeDetector handleWidth onResize={this.onResize}  />
      }
    </div>
  }
}

export default withConditionalRendering(ExpressionPlot)