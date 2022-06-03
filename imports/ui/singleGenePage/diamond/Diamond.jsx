import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import ReactResizeDetector from 'react-resize-detector';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import { branch, compose } from '/imports/ui/util/uiUtil.jsx';
import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import './diamond.scss';
import { scaleLinear } from 'd3';
import { getGeneSequences } from '/imports/api/util/util.js';

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">Diamond</h4>
    </>
  );
}

function hasNoDiamond({ diamond }) {
  return typeof diamond === 'undefined';
}

function NoDiamond({ showHeader }) {
  return (
    <>
      {showHeader && <Header />}
      <article className="message no-orthogroup" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No Diamond informations found</p>
        </div>
      </article>
    </>
  );
}

function DiamondDataTracker({ gene }) {
  const queryGenes = Genes.findOne({ ID: gene.ID });
  const diamondId = queryGenes.diamondId;

  const diamondSub = Meteor.subscribe('diamond');
  const loading = !diamondSub.ready();
  const diamond = diamondCollection.findOne({ _id: diamondId });

  const sequences = getGeneSequences(gene);
  console.log("seq diamond data tracker :", sequences);

  // Put condition for bastn or bastp.
  const genesLength = sequences[0].prot.length;

  return {
    loading,
    gene,
    diamond,
    genesLength,
  };
}

function TopBarSequence({ length, scale }) {
  const range = scale.range();
  const [start, end] = scale.domain();

  console.log("start", start);
  console.log("end", end);
  console.log("range", range);

  const nbrTicks = 11;
  const textTicks = [];
  const stepSize = Math.round((end - start) / nbrTicks);

  for (let i = 1; i < nbrTicks; i += 1) {
    textTicks.push(start + i * stepSize);
  }

  return (
    <svg width={range[1] + 10} height="16" transform="translate(134, 0)">
      <g>
        <line x1={range[0]} y1="15" x2={range[1]} y2="15" stroke="black" />
        <g>
          <line x1={range[0]} y1="10" x2={range[0]} y2="15" stroke="black" />
          <text x={range[0]} y="4" dy="5" textAnchor="middle" fontSize="10">
            0
          </text>
        </g>
        {textTicks.map((tick) => {
          const pos = scale(tick);
          return (
            <g key={tick}>
              <line x1={pos} x2={pos} y1="10" y2="15" stroke="black" />
              <text x={pos} y="4" dy="5" textAnchor="middle" fontSize="10">
                {tick}
              </text>
            </g>
          );
        })}
        <g>
          <line x1={range[1]} y1="10" x2={range[1]} y2="15" stroke="black" />
          <text x={range[1]} y="4" dy="5" textAnchor="middle" fontSize="10">
            {length}
          </text>
        </g>
      </g>
    </svg>
  );
}

function HitsCoverLines({ diamond, scale, height }) {
  const range = scale.range();
  return (
    <svg width={range[1]} height={height}>
      {
        diamond.iteration_hits.map((hit, index) => {
          const queryHitId = hit.id;
          const posX = scale(hit['query-from']);
          const wRect = scale(hit['query-to'] - hit['query-from']);
          return (
            <g>
              <text x="25" y={(index * (12 + 8) + 12)} fontSize="14">{queryHitId}</text>
              <rect transform="translate(134, 0)" key={hit.id} x={posX} y={(index * (12 + 8))} width={wRect} height="12" stroke="#7f7f7f" fill="#7f7f7f" />
            </g>
          );
        })
      }
    </svg>
  );
}

function GlobalDiamondInformation({ diamond, length, initialWidth = 200}) {
  const [width, setWidth] = useState(initialWidth);

  const margin = {
    top: 10,
    bottom: 10,
    left: 20,
    right: 20,
  };

  const height = ((diamond.iteration_hits.length + 1) * 20);

  const scale = scaleLinear()
    .domain([0, length])
    .range([margin.left, width - margin.right - 140]);

  return (
    <div className="card">

      <div id="general-diamond-informations">
        <table className="table-diamond table">
          <tbody>
            <tr>
              <th colSpan="2" className="is-light">
                General informations
              </th>
            </tr>
            <tr>
              <td>Query sequence :</td>
              <td>{diamond.iteration_query}</td>
            </tr>
            <tr>
              <td>Algorithm :</td>
              <td>blastp (protein-protein BLAST)</td>
            </tr>
            <tr>
              <td>Database :</td>
              <td>Non-redundant protein sequences (nr)</td>
            </tr>
            <tr>
              <td>Total hits :</td>
              <td>{diamond.iteration_hits.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="diamond-body">
        <div>
          <div id="top-bar-sequence">
            <TopBarSequence length={length} scale={scale} />
          </div>
          <div>
            <HitsCoverLines diamond={diamond} scale={scale} height={height} />
          </div>
        </div>
        <ReactResizeDetector handleWidth onResize={(w) => setWidth(w)} />
      </div>

    </div>
  );
}

function DiamondBlast({ showHeader = false, diamond, genesLength }) {
  return (
    <>
      { showHeader && <Header />}
      <div>
        <GlobalDiamondInformation diamond={diamond} length={genesLength} />
      </div>
    </>
  );
}

export default compose(
  withTracker(DiamondDataTracker),
  branch(hasNoDiamond, NoDiamond),
)(DiamondBlast);
