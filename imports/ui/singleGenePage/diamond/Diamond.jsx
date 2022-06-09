import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import ReactResizeDetector from 'react-resize-detector';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import { branch, compose } from '/imports/ui/util/uiUtil.jsx';
import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState } from 'react';
import './diamond.scss';
import { scaleLinear } from 'd3';
import { getGeneSequences } from '/imports/api/util/util.js';
import { Seq } from '/imports/ui/singleGenePage/Seq.jsx';
import {
  Popover,
  PopoverTrigger,
  PopoverBody,
} from '/imports/ui/util/Popover.jsx';

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
        <line x1={scale(start + 1)} y1="15" x2={range[1]} y2="15" stroke="black" />
        <g>
          <line x1={scale(start + 1)} y1="10" x2={scale(start + 1)} y2="15" stroke="black" />
          <text x={scale(start + 1)} y="4" dy="5" textAnchor="middle" fontSize="10">
            1
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

function DescriptionLimited({ description }) {
  const maxChar = 70;
  const isMaxChar = description.length > maxChar;

  const [openDesc, setDesc] = useState(true);
  const [descChar, setDescChar] = useState('');

  useEffect(() => {
    if (isMaxChar) {
      if (openDesc) {
        const descNoMax = description
          ? `${description.slice(0, maxChar)} ...`
          : description;
        setDescChar(descNoMax);
      } else {
        setDescChar(description);
      }
    } else {
      setDescChar(description);
    }
  }, [openDesc]);

  const buttonText = openDesc ? 'Show less' : 'Show more ...';

  return (
    <>
      <b>{ descChar }</b>
      {
        isMaxChar
          ? (
            <button
              type="button"
              className="is-link"
              onClick={() => setDesc(!openDesc)}
            >
              <small>{ buttonText }</small>
            </button>
          ) : null
      }
    </>
  );
}

function SequenceID({ id }) {
  const ncbiUrl = 'https://www.ncbi.nlm.nih.gov/search/all/?term=';

  return (
    <a href={`${ncbiUrl}${id}`} target="_blank" rel="noreferrer">
      { id }
    </a>
  );
}

function PourcentageView({ length_hit, length_sequence }) {
  const pourcentage = ((length_hit / length_sequence ) * 100).toFixed(2);
  return (
    <p>{length_hit}/{length_sequence} ({pourcentage}%)</p>
  );
}

function PreviewDiamondAlign({
  seqFrom,
  seqTo,
  hitFrom,
  hitTo,
  queryseq,
  hitmidline,
}) {
  const queryStr = 'Query';
  const sbjctStr = 'Sbjct';

  const queryAlign = queryStr.concat(' ', seqFrom, ' ', queryseq.slice(0, 60), ' ', seqTo);
  console.log('Seq Align :', queryAlign);

  let queryAlignTest = '';
  const maxSplit = 50;
  for (let i = 0; i < Math.floor(queryseq.length / maxSplit) + 1; i += 1) {
    console.log('i :', i);

    queryAlignTest += 'Query ';
    const maxSpaceCount = queryseq.length.toString().length;
    const minSpaceCount = ((Number(seqFrom) + (i * maxSplit)).toString().length);
    console.log((Number(seqFrom) + (i * maxSplit)) );
    const repeatSpace = (maxSpaceCount - minSpaceCount + 1);
    console.log('max space count : ', maxSpaceCount);
    console.log('min space count : ', minSpaceCount);
    console.log('repeat space :', repeatSpace);
    queryAlignTest += Number(seqFrom) + (i * maxSplit);
    queryAlignTest += ' '.repeat(repeatSpace);
    queryAlignTest += ' ';
    queryAlignTest += queryseq.slice((i * maxSplit), ((i + 1) * maxSplit));
    queryAlignTest += ' ';
    if (((i + 1) * maxSplit) >= queryseq.length) {
      queryAlignTest += seqTo;
    } else {
      queryAlignTest += ((i + 1) * maxSplit);
    }
    queryAlignTest += '\n';
    queryAlignTest += ' '.repeat(7 + minSpaceCount + repeatSpace);
    queryAlignTest += hitmidline.slice((i * maxSplit), ((i + 1) * maxSplit));
    queryAlignTest += '\n';
  }
  console.log(queryAlignTest);
  return (
    <pre style={{ margin: '0', lineHeight: '1', display: 'block', maxWidth: '600px', height: 'auto'}}>
      {queryAlignTest}
    </pre>
  );
}

function HitIntervalinfo({
  id,
  def,
  accession,
  length,
  score,
  bit_score,
  evalue,
  identity,
  positive,
  gaps,
  query_seq,
  midline,
  query_from,
  query_to,
  hit_from,
  hit_to,
}) {
  return (
    <div className="panel-body">
      <table className="table is-hoverable is-narrow is-small">
        <tr>
          <td colSpan="2">
            <DescriptionLimited description={def} />
          </td>
        </tr>
        <tr>
          <td>Sequence ID :</td>
          <td>
            <SequenceID id={id} />
          </td>
        </tr>
        <tr>
          <td>Accession :</td>
          <td>{accession}</td>
        </tr>
        <tr>
          <td>Length :</td>
          <td>{length}</td>
        </tr>
        <tr>
          <td>Score :</td>
          <td>{bit_score} bits ({score})</td>
        </tr>
        <tr>
          <td>Expect:</td>
          <td>{evalue}</td>
        </tr>
        <tr>
          <td>Identity :</td>
          <td>
            <PourcentageView length_hit={identity} length_sequence={length} />
          </td>
        </tr>
        <tr>
          <td>Positive :</td>
          <td>
            <PourcentageView length_hit={positive} length_sequence={length} />
          </td>
        </tr>
        <tr>
          <td>Gaps :</td>
          <td>
            <PourcentageView length_hit={gaps} length_sequence={length} />
          </td>
        </tr>
        {/* <tr> */}
        {/*   <td colSpan="2"> */}
        {/*     <h6>Query sequence :</h6> */}
        {/*     <div className="exon-sequence"> */}
        {/*       <Seq header={id} sequence={query_seq} maxLength={70} fontSize=".8rem" /> */}
        {/*     </div> */}
        {/*   </td> */}
        {/* </tr> */}
        {/* <tr> */}
        {/*   <td colSpan="2"> */}
        {/*     <h6>Midline :</h6> */}
        {/*     <div className="exon-sequence"> */}
        {/*       <Seq header={id} sequence={midline} maxLength={70} fontSize=".8rem" /> */}
        {/*     </div> */}
        {/*   </td> */}
        {/* </tr> */}
      </table>
      <PreviewDiamondAlign
        seqFrom={query_from}
        seqTo={query_to}
        hitFrom={hit_from}
        hitTo={hit_to}
        queryseq={query_seq}
        hitmidline={midline}
      />
    </div>
  );
}

function HitsCoverLines({ diamond, scale, height }) {
  const range = scale.range();
  return (
    <svg width={range[1] + 134} height={height}>
      {
        diamond.iteration_hits.map((hit, index) => {
          const queryHitId = hit.id;
          const posX = scale(hit['query-from']);
          const wRect = scale(hit['query-to'] - hit['query-from']);
          return (
            <g>
              <text x="25" y={(index * (12 + 8) + 12)} fontSize="14">{queryHitId}</text>
              <Popover>
                <PopoverTrigger>
                  <rect
                    className="hit-cover"
                    transform="translate(134, 0)"
                    key={hit.id}
                    x={posX}
                    y={(index * (12 + 8))}
                    width={wRect}
                    height="12"
                    stroke="#7f7f7f"
                    fill="#7f7f7f"
                  />
                </PopoverTrigger>
                <PopoverBody
                  header={hit.def.length > 49 ? hit.def.substring(0, 49).concat(' ...') : hit.def}
                  widthBody={600}
                >
                  <HitIntervalinfo
                    id={hit.id}
                    def={hit.def}
                    accession={hit.accession}
                    length={hit.length}
                    score={hit.score}
                    bit_score={hit['bit-score']}
                    evalue={hit.evalue}
                    identity={hit.identity}
                    positive={hit.positive}
                    gaps={hit.gaps}
                    query_seq={hit['query-seq']}
                    midline={hit.midline}
                    query_from={hit['query-from']}
                    query_to={hit['query-to']}
                    hit_from={hit['hit-from']}
                    hit-to={hit['hit-to']}
                  />
                </PopoverBody>
              </Popover>
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
              <td>Total hits selected :</td>
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
