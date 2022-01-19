/* eslint-disable react/prop-types */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable camelcase */
/* eslint-disable react/no-multi-comp */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import { mean, sum, groupBy } from 'lodash';
import randomColor from 'randomcolor';

import { scaleLinear } from 'd3';

import {
  Transcriptomes,
} from '/imports/api/transcriptomes/transcriptome_collection.js';

import {
  branch, compose, round, /* ErrorBoundary, */
} from '/imports/ui/util/uiUtil.jsx';
import {
  Popover, PopoverTrigger, PopoverBody,
} from '/imports/ui/util/Popover.jsx';

import './expressionPlot.scss';

function expressionDataTracker({
  gene, samples, loading,
}) {
  const transcriptomeSub = Meteor.subscribe('geneExpression', gene.ID);

  const sampleInfo = groupBy(samples, '_id');
  const sampleIds = samples.map((sample) => sample._id);

  const values = Transcriptomes.find({
    geneId: gene.ID,
    experimentId: {
      $in: sampleIds,
    },
  })
    .fetch()
    .map((value) => {
      Object.assign(value, sampleInfo[value.experimentId][0]);
      return value;
    });

  return {
    gene,
    values,
    loading: loading || !transcriptomeSub.ready(),
  };
}

function hasNoSamples({ samples }) {
  return samples.length === 0;
}

function NoSamples() {
  return (
    <div className="card expression-plot">
      <article className="message no-protein-domains" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No samples selected</p>
        </div>
      </article>
    </div>
  );
}

function isLoading({ loading }) {
  return loading;
}

function Loading() {
  return (
    <div className="card expression-plot">
      <h5 className="subtitle is-5">Loading ...</h5>
      <progress className="progress is-small is-dark" max="100" />
    </div>
  );
}

function YAxis({ scale, numTicks }) {
  const range = scale.range();
  const [start, end] = scale.domain();
  // const precision = end > 10 ? 0 : end > 1 ? 1 : 2;

  let precision = 2;
  if (end > 1) {
    precision = 1;
  } else if (end > 10) {
    precision = 0;
  }

  const stepSize = (end - start) / numTicks;
  const ticks = [];

  for (let i = 1; i < numTicks; i += 1) {
    ticks.push(start + i * stepSize);
  }

  return (
    <g className="y-axis">
      <text
        y="-35"
        x={(range[1] - range[0]) / 2}
        fontSize="11"
        transform="rotate(-90)"
        textAnchor="middle"
      >
        TPM
      </text>
      <line x1="0" x2="0" y1={range[0]} y2={range[1]} stroke="black" />
      <g>
        <line x1="-5" x2="0" y1={range[0]} y2={range[0]} stroke="black" />
        <text x="-10" y={range[0]} textAnchor="end" fontSize="10">
          {round(start, precision)}
        </text>
      </g>
      {ticks.map((tick) => {
        const pos = scale(tick);
        return (
          <g key={tick}>
            <line x1="-5" x2="0" y1={pos} y2={pos} stroke="black" />
            <text x="-10" y={pos} textAnchor="end" fontSize="10">
              {round(tick, precision)}
            </text>
          </g>
        );
      })}
      <g>
        <line x1="-5" x2="0" y1={range[1]} y2={range[1]} stroke="black" />
        <text x="-10" y={range[1]} textAnchor="end" fontSize="10">
          {round(end, precision)}
        </text>
      </g>
    </g>
  );
}

function ExpressionDot({
  yScale, tpm, est_counts, description, replicaGroup, sampleName,
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <circle
          className="expression"
          // id={targetId}
          cx="0"
          cy={yScale(tpm)}
          r="4"
          strokeWidth="1"
          fill="white"
        />
      </PopoverTrigger>
      <PopoverBody header={sampleName}>
        <div className="panel-block">
          <table className="table is-small is-narrow is-hoverable">
            <tbody>
              <tr>
                <td>TPM</td>
                <td>{tpm}</td>
              </tr>
              <tr>
                <td>EST counts</td>
                <td>{est_counts}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>{description}</td>
              </tr>
              <tr>
                <td>Replica group</td>
                <td>{replicaGroup}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PopoverBody>
    </Popover>
  );
}

function DotPlot({ groupSamples, yScale }) {
  return (
    <g className="dotplot">
      {groupSamples.map((sample) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <ExpressionDot key={sample._id} yScale={yScale} {...sample} />
      ))}
    </g>
  );
}

function BarPlot({ replicaGroup, groupSamples, yScale }) {
  const tpm = groupSamples.map((sample) => sample.tpm);
  const meanVal = mean(tpm);
  const width = 20;

  const stdDev = Math.sqrt(
    sum(groupSamples.map((sample) => (sample.tpm - meanVal) ** 2)),
  );

  const stdErr = stdDev / Math.sqrt(groupSamples.length);

  const fill = randomColor({ seed: replicaGroup });
  const style = { fill, fillOpacity: 0.5 };

  return (
    <g className="barplot">
      <rect
        className="barplot"
        x={-0.5 * width}
        width={width}
        style={style}
        y={yScale(meanVal)}
        height={yScale.range()[0] - yScale(meanVal)}
      />
      <line
        className="stderr"
        x1="0"
        x2="0"
        y1={yScale(meanVal - stdErr)}
        y2={yScale(meanVal + stdErr)}
        stroke="black"
      />
      <line
        className="stderr"
        x1={-0.33 * width}
        x2={0.33 * width}
        y1={yScale(meanVal - stdErr)}
        y2={yScale(meanVal - stdErr)}
        stroke="black"
      />
      <line
        className="stderr"
        x1={-0.33 * width}
        x2={0.33 * width}
        y1={yScale(meanVal + stdErr)}
        y2={yScale(meanVal + stdErr)}
        stroke="black"
      />
    </g>
  );
}

function GroupedSamplePlot({
  replicaGroup, groupSamples, yScale, transform,
}) {
  const [highlight, setHighlight] = useState(false);
  const range = yScale.range();
  const highlightStyle = { stroke: 'none', fill: '#d9d9d9' };
  return (
    <g
      className="grouped-sample-plot"
      transform={transform}
      onMouseOver={() => { setHighlight(true); }}
      onFocus={() => { setHighlight(true); }}
      onMouseOut={() => { setHighlight(false); }}
      onBlur={() => { setHighlight(false); }}
    >
      <g transform={`translate(0,${range[0]})`}>
        {highlight && (
          <g className="highlight">
            <rect
              x={-12.5}
              width={25}
              y={-range[0]}
              height={range[0] + 30}
              style={highlightStyle}
            />
            <rect
              x={-184}
              width={150}
              y={14}
              height={28}
              transform="rotate(-45,-25,-20)"
              style={highlightStyle}
            />
          </g>
        )}
        <line x1="-20" x2="20" y1="0" y2="0" stroke="black" />
        <line x1="0" x2="0" y1="0" y2="10" stroke="black" />
        <text
          x="-12"
          y="17"
          textAnchor="end"
          transform="rotate(-45)"
          fontSize="10"
        >
          <title>{`${replicaGroup} (n = ${groupSamples.length})`}</title>
          {`${replicaGroup.slice(0, 20)}`
            + `${replicaGroup.length > 20 ? '... ' : ' '}`
            + `(n = ${groupSamples.length})`}
        </text>
      </g>
      <BarPlot
        replicaGroup={replicaGroup}
        groupSamples={groupSamples}
        yScale={yScale}
      />
      <DotPlot
        replicaGroup={replicaGroup}
        groupSamples={groupSamples}
        yScale={yScale}
      />
    </g>
  );
}

function GroupedSamples({ replicaGroups, yScale, transform }) {
  return (
    <g className="sample-groups" transform={transform}>
      {Object.entries(replicaGroups).map(
        ([replicaGroup, groupSamples], index) => (
          <GroupedSamplePlot
            key={replicaGroup}
            replicaGroup={replicaGroup}
            groupSamples={groupSamples}
            yScale={yScale}
            transform={`translate(${index * 40},0)`}
          />
        ),
      )}
    </g>
  );
}

function ExpressionPlot({ values, resizable, height }) {
  const [width, setWidth] = useState(250);
  const tpm = values.map((value) => value.tpm);
  tpm.push(1);
  const maxTpm = Math.max(...tpm);

  let precision = 2;
  if (maxTpm > 1) {
    precision = 1;
  } else if (maxTpm > 10) {
    precision = 0;
  }
  const yMax = round(maxTpm + 0.1 * maxTpm, precision);

  const replicaGroups = groupBy(values, 'replicaGroup');
  const numGroups = Object.keys(replicaGroups).length;
  const padding = {
    top: 20,
    bottom: 10,
    left: 50,
    right: 10,
  };

  const yScale = scaleLinear()
    .domain([0, yMax])
    .range([height - padding.top - padding.bottom, 0]);

  return (
    <div className="card expression-plot">
      <div style={{ width, overflowX: 'scroll' }}>
        <div id="expression-popover" />
        <svg width={170 + numGroups * 40} height={height + 125}>
          <g transform={`translate(${padding.left},${padding.top})`}>
            <YAxis scale={yScale} numTicks="4" />
            <GroupedSamples
              replicaGroups={replicaGroups}
              yScale={yScale}
              transform="translate(20,0)"
            />
          </g>
        </svg>
      </div>
      {resizable && (
        <ReactResizeDetector handleWidth onResize={(newWidth) => { setWidth(newWidth); }} />
      )}
    </div>
  );
}

ExpressionPlot.defaultProps = {
  resizable: true,
  height: 250,
};

ExpressionPlot.propTypes = {
  values: PropTypes.array.isRequired,
  resizable: PropTypes.bool,
  height: PropTypes.number,
};

export default compose(
  branch(isLoading, Loading),
  branch(hasNoSamples, NoSamples),
  withTracker(expressionDataTracker),
  branch(isLoading, Loading),
)(ExpressionPlot);
