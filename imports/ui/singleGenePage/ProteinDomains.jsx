/* eslint-disable max-classes-per-file */
import React, { useState } from 'react';
import { scaleLinear } from 'd3';// -scale';
import { groupBy } from 'lodash';
import ReactResizeDetector from 'react-resize-detector';
import randomColor from 'randomcolor';

import { getGeneSequences } from '/imports/api/util/util.js';

import { branch, compose } from '/imports/ui/util/uiUtil.jsx';

import {
  Popover, PopoverTrigger, PopoverBody,
} from '/imports/ui/util/Popover.jsx';

import './proteinDomains.scss';

function XAxis({
  scale, numTicks, transform, seqid,
}) {
  const range = scale.range();

  const [start, end] = scale.domain();

  const stepSize = Math.round((end - start) / numTicks);

  const ticks = [start];

  for (let i = 1; i < numTicks; i += 1) {
    ticks.push(start + (i * stepSize));
  }
  ticks.push(end);
  return (
    <g className="x-axis" transform={transform}>
      <text
        className="axis-label"
        x={range[0]}
        y="0"
        dy="5"
        textAnchor="left"
        fontSize="11"
      >
        {seqid}
      </text>
      <line
        className="backbone"
        x1={range[0]}
        x2={range[1]}
        y1="25"
        y2="25"
        stroke="black"
      />
      {
        ticks.map((tick, tickIndex) => {
          const pos = scale(tick);
          let textAnchor;
          if (tickIndex === 0) {
            textAnchor = 'start';
          } else if (tickIndex === ticks.length - 1) {
            textAnchor = 'end';
          } else {
            textAnchor = 'middle';
          }
          return (
            <g className="tick" key={tick}>
              <line x1={pos} x2={pos} y1="20" y2="25" stroke="black" />
              <text
                x={pos}
                y="10"
                dy="5"
                textAnchor={textAnchor}
                fontSize="10"
              >
                { tick }
              </text>
            </g>
          );
        })
      }
    </g>
  );
}

/*
function DomainPopover({
  showPopover, targetId, togglePopover, ...domain
}) {
  const {
    start, end, score, name, Dbxref = [], Ontology_term = [],
    signature_desc, source,
  } = domain;
  return (
    <Popover
      placement="top"
      isOpen={showPopover}
      target={targetId}
      toggle={togglePopover}
    >
      <PopoverHeader>
        {source}
        {' '}
        <small className="text-muted">{ name }</small>
      </PopoverHeader>
      <PopoverBody className="px-0 py-0">
        <div className="table-responive">
          <table className="table table-hover">
            <tbody>
              {
              signature_desc
              && (
              <tr>
                <td>Signature description</td>
                <td>{signature_desc}</td>
              </tr>
              )
            }
              <tr>
                <td>Coordinates</td>
                <td>
                  {`${start}..${end}`}
                </td>
              </tr>
              <tr>
                <td>Score</td>
                <td>{score}</td>
              </tr>
              {
              Dbxref.length > 0
              && (
              <tr>
                <td>Dbxref</td>
                <td>
                  <ul>
                    {
                      Dbxref.map((xref) => (
                        <li key={xref}>
                          { xref }
                        </li>
                      ))
                    }
                  </ul>
                </td>
              </tr>
              )
            }
              {
              Ontology_term.length > 0
              && (
              <tr>
                <td>Ontology term</td>
                <td>
                  <ul>
                    {
                      Ontology_term.map((term) => (
                        <li key={term}>
                          { term }
                        </li>
                      ))
                    }
                  </ul>
                </td>
              </tr>
              )
            }
            </tbody>
          </table>
        </div>
      </PopoverBody>
    </Popover>
  );
}
*/

function ProteinDomain({
  interproId, start, end, name, domainIndex, scale, Dbxref = [], Ontology_term = [], signature_desc, source, score,
}) {
  const fill = interproId === 'Unintegrated signature'
    ? 'grey'
    : randomColor({ seed: interproId });
  const style = { fill, fillOpacity: 0.5 };
  const targetId = `${name.replace(/[:\.]/g, '_')}_${start}_${end}`;
  return (
    <Popover>
      <PopoverTrigger>
        <rect
          className="protein-domain-interval"
          x={scale(start)}
          width={scale(end) - scale(start)}
          y="0"
          height="8"
          rx="2"
          ry="2"
          style={style}
          id={targetId}
        />
      </PopoverTrigger>
      <PopoverBody header={name}>
        <div className="panel-block">
          <table className="table is-small is-narrow is-hoverable">
            <tbody>
              <tr>
                <td>Signature description</td>
                <td>{signature_desc || 'Not available'}</td>
              </tr>
              <tr>
                <td>Coordinates</td>
                <td>
                  {`${start}..${end}`}
                </td>
              </tr>
              <tr>
                <td>Score</td>
                <td>{score}</td>
              </tr>
              <tr>
                <td>Source</td>
                <td>{source}</td>
              </tr>
              { Dbxref.length > 0 && (
              <tr>
                <td>Dbxref</td>
                <td>
                  <ul>
                    { Dbxref.map((xref) => (
                      <li key={xref}>{ xref }</li>
                    ))}
                  </ul>
                </td>
              </tr>
              )}
              { Ontology_term.length > 0 && (
              <tr>
                <td>Ontology term</td>
                <td>
                  <ul>
                    { Ontology_term.map((term) => (
                      <li key={term}>{ term }</li>
                    ))}
                  </ul>
                </td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      </PopoverBody>
    </Popover>
  );
}

function SourceGroup({
  source, domains, transform, scale,
}) {
  return (
    <g transform={transform}>
      {
          domains.map((domain, domainIndex) => (
            <ProteinDomain
              key={domainIndex}
              {...domain}
              scale={scale}
            />
          ))
      }
    </g>
  );
}

function InterproGroup({
  interproId, sourceGroups, transform, scale,
}) {
  const [xMin, xMax] = scale.range();
  const descriptions = new Set();
  Object.entries(sourceGroups).forEach((sourceGroup, sourceIndex) => {
    const [source, domains] = sourceGroup;
    domains.forEach((domain) => {
      if (typeof domain.signature_desc !== 'undefined') {
        descriptions.add(domain.signature_desc);
      }
    });
  });
  const description = [...descriptions].sort((a, b) => b.length - a.length)[0];
  return (
    <g transform={transform}>
      <foreignObject width={xMax} height="25" x="0" y="-22">
        <p style={{
          fontSize: '.7rem',
          fontFamily: 'monospace',
          overflow: 'hidden',
          whitespace: 'nowrap',
          height: 25,
          textOverflow: 'ellipsis',
          wordBreak: 'break-all',
        }}
        >
          <a
            href={`https://www.ebi.ac.uk/interpro/entry/${interproId}`}
            style={{ fontSize: '.7rem' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {interproId}
          </a>
          { interproId !== 'Unintegrated signature' && ` ${description}`}
        </p>
      </foreignObject>
      {
        Object.entries(sourceGroups).map((sourceGroup, sourceIndex) => {
          const [source, domains] = sourceGroup;
          return (
            <SourceGroup
              key={source}
              source={source}
              domains={domains}
              transform={`translate(0,${sourceIndex * 10})`}
              index={sourceIndex}
              scale={scale}
            />
          );
        })
      }
    </g>
  );
}

function sortGroups(groupA, groupB) {
  const [nameA, intervalsA] = groupA;
  const [nameB, intervalsB] = groupB;
  if (nameA === 'Unintegrated signature') {
    return 1;
  }
  if (nameB === 'Unintegrated signature') {
    return -1;
  }
  const startA = Math.min(...intervalsA.map((interval) => interval.start));
  const startB = Math.min(...intervalsB.map((interval) => interval.start));

  return startA - startB;
}

function hasNoProteinDomains({ gene }) {
  const transcripts = gene.subfeatures.filter((sub) => sub.type === 'mRNA');
  const proteinDomains = transcripts.filter((transcript) => typeof transcript.protein_domains !== 'undefined');

  return proteinDomains.length === 0;
}

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">Protein domains</h4>
    </>
  );
}

function NoProteinDomains({ showHeader }) {
  return (
    <>
      { showHeader && <Header /> }
      <article className="message no-protein-domains" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No protein domains found</p>
        </div>
      </article>
    </>
  );
}

function ProteinDomains({
  gene,
  showHeader = false,
  resizable = false,
  initialWidth = 250,
}) {
  const [width, setWidth] = useState(initialWidth);

  // get sequence to determine length
  const sequences = getGeneSequences(gene);
  // interproscan results should be on transcripts
  const transcripts = gene.subfeatures.filter((sub) => sub.type == 'mRNA');
  // pick transcript with annotated protein domains
  const transcript = transcripts.filter((tr) => (
    typeof tr.protein_domains !== 'undefined'))[0];
  const transcriptSequence = sequences.filter((seq) => seq.ID === transcript.ID)[0];
  const transcriptSize = transcriptSequence.prot.length;

  const interproGroups = Object.entries(groupBy(transcript.protein_domains,
    'interproId')).sort(sortGroups);
  const totalGroups = interproGroups.length;
  const totalDomains = 0;
  /*
  const sortedDomains = interproGroups.map((domainGroup) => {
    const [interproId, domains] = domainGroup;
    const sourceGroups = Object.entries(groupBy(domains, 'name'));
    totalDomains += sourceGroups.length;
    return sourceGroups;
  });
  */

  const margin = {
    top: 10,
    bottom: 10,
    left: 20,
    right: 20,
  };

  const style = {
    marginLeft: margin.left,
    marginTop: margin.top,
  };

  const svgWidth = width - margin.left - margin.right;
  const svgHeight = (totalGroups * 30) + (totalDomains * 10)
    + margin.top + margin.bottom + 40;
  const scale = scaleLinear()
    .domain([0, transcriptSize])
    .range([0, svgWidth]);
  let domainCount = 0;
  return (
    <>
      { showHeader && <Header /> }
      <div className="card protein-domains">
        <svg width={svgWidth} height={svgHeight} style={style}>
          <XAxis
            scale={scale}
            numTicks={5}
            transform="translate(0,10)"
            seqid={transcript.ID}
          />
          <g className="domains" transform="translate(0,40)">
            {
              interproGroups.map((interproGroup, index) => {
                const [interproId, domains] = interproGroup;
                const sourceGroups = groupBy(domains, 'name');
                const yTransform = ((index + 1) * 30) + (domainCount * 10);
                const transform = `translate(0,${yTransform})`;
                domainCount += Object.entries(sourceGroups).length;
                return (
                  <InterproGroup
                    key={interproId}
                    interproId={interproId}
                    sourceGroups={sourceGroups}
                    transform={transform}
                    scale={scale}
                  />
                );
              })
            }
          </g>
        </svg>
        {resizable && (
          <ReactResizeDetector
            handleWidth
            onResize={(w) => setWidth(w)}
          />
        )}
      </div>
    </>
  );
}

export default compose(
  branch(hasNoProteinDomains, NoProteinDomains),
)(ProteinDomains);
