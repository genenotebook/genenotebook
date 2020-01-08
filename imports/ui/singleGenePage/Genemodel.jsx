import React, { useState } from 'react';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import ReactResizeDetector from 'react-resize-detector';
import { scaleLinear } from 'd3';
import randomColor from 'randomcolor';
import Color from 'color';

import AttributeValue from '/imports/ui/genetable/columns/AttributeValue.jsx';

import './genemodel.scss';

function XAxis({
  scale, numTicks, transform, seqid,
}) {
  const formatNumber = new Intl.NumberFormat().format;

  const range = scale.range();

  const [start, end] = scale.domain();

  const stepSize = Math.round((end - start) / numTicks);

  const ticks = [];

  for (let i = 1; i < numTicks; i += 1) {
    ticks.push(start + i * stepSize);
  }

  return (
    <g className="x-axis" transform={transform}>
      <line x1={range[0]} x2={range[1]} y1="5" y2="5" stroke="black" />
      <g>
        <line x1={range[0]} x2={range[0]} y1="0" y2="5" stroke="black" />
        <text x={range[0]} y="-10" dy="5" textAnchor="left" fontSize="10">
          {formatNumber(start)}
        </text>
      </g>
      {ticks.map((tick) => {
        const pos = scale(tick);
        return (
          <g key={tick}>
            <line x1={pos} x2={pos} y1="0" y2="5" stroke="black" />
            <text x={pos} y="-10" dy="5" textAnchor="middle" fontSize="10">
              {formatNumber(tick)}
            </text>
          </g>
        );
      })}
      <g>
        <line x1={range[1]} x2={range[1]} y1="0" y2="5" stroke="black" />
        <text x={range[1]} y="-10" dy="5" textAnchor="end" fontSize="10">
          {formatNumber(end)}
        </text>
      </g>
      <text x={range[0]} y="15" dy="5" textAnchor="left" fontSize="11">
        {seqid}
      </text>
    </g>
  );
}

function IntervalPopover({
  showPopover,
  togglePopover,
  targetId,
  ID,
  type,
  start,
  end,
  phase,
  attributes = {},
  seq,
}) {
  return (
    <Popover placement="top" isOpen={showPopover} target={targetId} toggle={togglePopover}>
      <PopoverHeader>{ID}</PopoverHeader>
      <PopoverBody className="px-0 py-0">
        <div className="table-responive">
          <table className="table table-hover">
            <tbody>
              <tr>
                <td>Type</td>
                <td>{type}</td>
              </tr>
              <tr>
                <td>Coordinates</td>
                <td>
                  {start}
                  ..
                  {end}
                </td>
              </tr>
              <tr>
                <td>Phase</td>
                <td>{phase}</td>
              </tr>
              {Object.entries(attributes).map(([attributeName, attributeValue]) => (
                <tr key={attributeName}>
                  <td>{attributeName}</td>
                  <td>
                    <AttributeValue {...{ attributeValue }} />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="2">
                  <h6>
                    {type}
                    &nbsp;sequence
                  </h6>
                  <div className="card exon-sequence">
                    <AttributeValue attributeValue={seq} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PopoverBody>
    </Popover>
  );
}

function Exon({
  genomeId, start, end, type, phase, scale, attributes, ID, seq,
}) {
  const [showPopover, setPopover] = useState(false);
  // function togglePopover() {
  //   setShowPopover(!showPopover);
  // }
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

  const targetId = `${type}-${start}-${end}`;

  const baseColor = new Color(randomColor({ seed: genomeId + genomeId.slice(3) }));
  const contrastColor = baseColor.isLight()
    ? baseColor.darken(0.5).saturate(0.3)
    : baseColor.lighten(0.5).desaturate(0.3);

  const fill = type === 'CDS' ? baseColor : contrastColor;
  const x = scale(start);
  const width = scale(end) - scale(start);
  const y = type === 'CDS' ? 0 : 4;
  const height = type === 'CDS' ? 12 : 4;

  // const style = { ':hover': { border: '1px solid black' } };

  return (
    <>
      <rect
        className="exon"
        {...{
          x,
          y,
          width,
          height,
          fill: fill.rgb(),
        }}
        id={targetId}
        onClick={togglePopover}
      />
      <IntervalPopover
        {...{
          targetId,
          ID,
          type,
          start,
          end,
          phase,
          attributes,
          seq,
          showPopover,
        }}
        togglePopover={togglePopover}
      />
    </>
  );
}

function Transcript({
  transcript, exons, scale, strand, genomeId, geneId,
}) {
  const [showPopover, setPopover] = useState(false);
  // function togglePopover() {
  //   setShowPopover(!showPopover);
  // }
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
  // put CDS exons last so they get drawn last and are placed on top
  exons.sort((exon1) => (exon1.type === 'CDS' ? 1 : -1));

  const { start, end } = transcript;

  const targetId = transcript.ID.replace(/\.|:/g, '_');

  // flip start and end coordinates based on strand so that marker end is always drawn correctly
  const x1 = scale(strand === '+' ? start : end);
  const x2 = scale(strand === '+' ? end : start);

  const y1 = 6;
  const y2 = 6;

  const t = strand === '+' ? 2 : -2;
  return (
    <>
      <line
        {...{
          x1,
          x2,
          y1,
          y2,
        }}
        stroke="black"
        markerEnd="url(#arrowEnd)"
        id={targetId}
      />
      <line
        {...{
          x1: x1 - t,
          x2: x2 + t,
          y1,
          y2,
        }}
        className="transcript-hover"
        onClick={togglePopover}
      />
      {exons.map((exon) => (
        <Exon
          key={exon.ID}
          {...{
            genomeId,
            geneId,
            scale,
            ...exon,
          }}
        />
      ))}
      <IntervalPopover
        {...{
          targetId,
          showPopover,
          ...transcript,
        }}
        togglePopover={togglePopover}
      />
    </>
  );
}

export function GenemodelGroup({
  gene, transcripts, width, scale,
}) {
  return (
    <g className="genemodel" transform="translate(0,4)">
      {transcripts.map((transcript, index) => {
        const exons = gene.subfeatures.filter(({ parents }) => parents.indexOf(transcript.ID) >= 0);
        const { ID: geneId, strand, genomeId } = gene;
        return (
          <g key={transcript.ID} className="transcript" transform={`translate(0,${index * 14})`}>
            <Transcript
              {...{
                exons,
                transcript,
                scale,
                geneId,
                genomeId,
                strand,
              }}
            />
          </g>
        );
      })}
    </g>
  );
}

export default function Genemodel({ gene, resizable = true }) {
  const [width, setWidth] = useState(250);

  const geneLength = gene.end - gene.start;
  const padding = Math.round(0.1 * geneLength);
  const start = Math.max(0, gene.start - padding);
  const end = gene.end + padding;

  const transcripts = gene.subfeatures.filter((subfeature) => subfeature.type === 'mRNA');

  const height = 14 * transcripts.length + 46;

  const margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };

  const scale = scaleLinear()
    .domain([start, end])
    .range([margin.left, width - margin.right]);

  return (
    <div id="genemodel" className="card genemodel">
      <svg width={width} height={height} className="genemodel-container">
        <GenemodelGroup gene={gene} transcripts={transcripts} width={width} scale={scale} />
        <XAxis
          scale={scale}
          numTicks="2"
          transform={`translate(0,${height - 22})`}
          seqid={gene.seqid}
        />
        <defs>
          <marker id="arrowEnd" markerWidth="15" markerHeight="10" refX="0" refY="5" orient="auto">
            <path d="M0,5 L15,5 L10,10 M10,0 L15,5" fill="none" stroke="black" strokeWidth="1" />
          </marker>
        </defs>
      </svg>
      {resizable && (
        <ReactResizeDetector
          handleWidth
          onResize={(w) => {
            setWidth(w);
          }}
        />
      )}
    </div>
  );
}
