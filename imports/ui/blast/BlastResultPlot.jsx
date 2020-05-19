import React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { scaleLinear, interpolateGreys } from 'd3';

import './blastResultPlot.scss';

/*
const PopoverHover = (props) => (
  <Popover id="blast-plot-popover" title={props.geneID}>
    <p>
      <small>
        <b>E-value</b>
:
        {props.evalue}
        <br />
        <b>Bitscore</b>
:
        {props.bitScore}
        <br />
        <b>Alignment length</b>
:
        {props.alignmentLength}
        <br />
        <b>Gaps</b>
:
        {props.gaps}
      </small>
    </p>
  </Popover>
);
*/

function XAxis({ scale, numTicks, ...props }) {
  const range = scale.range();
  const width = range[1];

  const domain = scale.domain();
  const queryLength = domain[1];

  const stepSize = Math.round(queryLength / numTicks);

  const ticks = [];

  for (let i = 1; i < numTicks; i += 1) {
    ticks.push(i * stepSize);
  }

  return (
    <g className="x-axis" transform="translate(0,15)">
      <line x1="0" x2={width} y1="5" y2="5" stroke="black" />
      <g>
        <line x1="0" x2="0" y1="0" y2="5" stroke="black" />
        <text x="0" y="-10" dx="5" dy="5" textAnchor="middle">
          0
        </text>
      </g>
      {ticks.map((tick) => {
        const pos = scale(tick);
        return (
          <g key={tick}>
            <line x1={pos} x2={pos} y1="0" y2="5" stroke="black" />
            <text x={pos} y="-10" dx="5" dy="5" textAnchor="middle">
              {tick}
            </text>
          </g>
        );
      })}
      <g>
        <line x1={width} x2={width} y1="0" y2="5" stroke="black" />
        <text x={width} y="-10" dx="5" dy="5" textAnchor="end">
          {queryLength}
        </text>
      </g>
    </g>
  );
}

function HitPlotLine({
  hit, index, height, xScale, maxBitScore, ...props
}) {
  const hsps = hit.Hit_hsps;
  // const geneID = hit.Hit_def[0].split(' ')[1];
  return (
    <g transform={`translate(0,${index * height})`}>
      {hsps.map((_hsp, hspIndex) => {
        const hsp = _hsp.Hsp[0];
        const x = hsp['Hsp_query-from'];
        const width = hsp['Hsp_query-to'] - x;
        const bitScore = hsp['Hsp_bit-score'];
        // const alignmentLength = hsp['Hsp_align-len'];
        // const gaps = hsp.Hsp_gaps;
        // const evalue = hsp.Hsp_evalue;
        return (
          <rect
            key={hspIndex}
            className="hsp"
            x={xScale(x)}
            y="0"
            width={xScale(width)}
            height={height / 2}
            rx="2"
            ry="2"
            style={{
              fill: interpolateGreys(bitScore / maxBitScore),
              strokeWidth: 0.5,
              stroke: 'hsl(0, 0%, 29%)',
            }}
          />
        );
      })}
    </g>
  );
}

function HitPlot({
  width, queryLength, hits, ...props
}) {
  const padding = {
    top: 10,
    bottom: 10,
    left: 20,
    right: 60,
  };
  const paddedWidth = width - padding.left - padding.right;
  const xScale = scaleLinear()
    .domain([0, queryLength])
    .range([0, paddedWidth]);
  const maxBitScore = hits[0].Hit_hsps[0].Hsp[0]['Hsp_bit-score'][0];
  const lineHeight = 12;

  const height = lineHeight * hits.length + padding.top + padding.bottom + 30;

  return (
    <svg width={width} height={height}>
      <g className="blast-hit-plot" transform={`translate(${padding.left},${padding.top})`}>
        <XAxis scale={xScale} numTicks={10} />
        <g className="hits" transform="translate(0,30)">
          {hits.map((hit, index) => (
            <HitPlotLine
              key={index}
              hit={hit}
              index={index}
              xScale={xScale}
              height={lineHeight}
              maxBitScore={maxBitScore}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}

export default function BlastResultPlot({ job }) {
  const { result, data } = job;
  const hits = result.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
  return (
    <fieldset className="box blast-result-plot">
      <legend className="subtitle is-5">HSP Plot</legend>
      <ReactResizeDetector handleWidth>
        {({ width }) => (
          <HitPlot
            width={width}
            hits={hits}
            queryLength={data.input.length}
          />
        )}
      </ReactResizeDetector>
    </fieldset>
  );
}
