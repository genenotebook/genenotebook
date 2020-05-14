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
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { scaleLinear } from 'd3'; // -scale';

import {
  Transcriptomes,
} from '/imports/api/transcriptomes/transcriptome_collection.js';

import { branch, compose, round } from '/imports/ui/util/uiUtil.jsx';

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
    <div className="card expression-plot px-1 pt-1 mb-0">
      <div className="alert alert-dark mx-1 mt-1" role="alert">
        <p className="text-center text-muted mb-0">No expression data found</p>
      </div>
    </div>
  );
}

function isLoading({ loading }) {
  return loading;
}

function Loading() {
  return (
    <div className="card expression-plot px-1 pt-1 mb-0">
      <div className="alert alert-light mx-1 mt-1" role="alert">
        <p className="text-center text-muted mb-0">Loading ...</p>
      </div>
    </div>
  );
}

function ExpressionPopover({
  showPopover,
  targetId,
  togglePopover,
  ...expression
}) {
  const {
    tpm, est_counts, description, replicaGroup, sampleName,
  } = expression;
  return (
    <Popover
      placement="top"
      isOpen={showPopover}
      target={targetId}
      toggle={togglePopover}
    >
      <PopoverHeader>{sampleName}</PopoverHeader>
      <PopoverBody className="px-0 py-0">
        <div className="table-responive">
          <table className="table table-hover">
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

function YAxis({ scale, numTicks }) {
  const range = scale.range();
  const [start, end] = scale.domain();
  const precision = end > 10 ? 0 : end > 1 ? 1 : 2;

  const stepSize = (end - start) / numTicks;
  const ticks = [];

  for (let i = 1; i < numTicks; i++) {
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

function ExpressionDot({ yScale, ...sample }) {
  const [showPopover, setPopover] = useState(false);
  function closePopover() {
    document.removeEventListener('click', closePopover);
    setPopover(false);
  }
  function openPopover() {
    document.addEventListener('click', closePopover);
    setPopover(true);
  }
  function togglePopover() {
    if (showPopover) {
      closePopover();
    } else {
      openPopover();
    }
  }
  const targetId = `x${sample._id}`;
  return (
    <>
      <circle
        className="expression"
        id={targetId}
        cx="0"
        cy={yScale(sample.tpm)}
        r="4"
        strokeWidth="1"
        fill="white"
        onClick={togglePopover}
      />
      <ExpressionPopover
        {...{ targetId, showPopover, ...sample }}
        togglePopover={togglePopover}
      />
    </>
  );
}

function DotPlot({ groupSamples, yScale }) {
  return (
    <g className="dotplot">
      {groupSamples.map((sample) => (
        <ExpressionDot key={sample._id} {...{ yScale, ...sample }} />
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
      <BarPlot {...{ replicaGroup, groupSamples, yScale }} />
      <DotPlot {...{ replicaGroup, groupSamples, yScale }} />
    </g>
  );
}

function GroupedSamples({ replicaGroups, yScale, transform }) {
  return (
    <g transform={transform}>
      {Object.entries(replicaGroups).map(
        ([replicaGroup, groupSamples], index) => (
          <GroupedSamplePlot
            key={replicaGroup}
            {...{ replicaGroup, groupSamples }}
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
  const precision = maxTpm > 10 ? 0 : maxTpm > 1 ? 1 : 2;
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
