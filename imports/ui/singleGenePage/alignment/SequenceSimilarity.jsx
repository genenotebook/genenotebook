import { similarSequencesCollection } from '/imports/api/genes/alignment/similarSequenceCollection.js';
import ReactResizeDetector from 'react-resize-detector';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import { branch, compose } from '/imports/ui/util/uiUtil.jsx';
import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState } from 'react';
import './seq-similarity.scss';
import { scaleLinear } from 'd3';
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
      <h4 className="subtitle is-4">Sequence Similarity</h4>
    </>
  );
}

function hasNoSequenceSimilarity({ similarSequences }) {
  return typeof similarSequences === 'undefined';
}

function NoSequenceSimilarity({ showHeader }) {
  return (
    <>
      {showHeader && <Header />}
      <article className="message no-orthogroup" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No sequence alignment data has been found.</p>
        </div>
      </article>
    </>
  );
}

function SequenceSimilarityDataTracker({ gene }) {
  const queryGenes = Genes.findOne({ ID: gene.ID });
  const subfeatures = queryGenes.subfeatures[0].ID;
  console.log('subfeatures :', subfeatures);

  const alignmentSub = Meteor.subscribe('alignment');
  const loading = !alignmentSub.ready();
  const similarSequences = similarSequencesCollection.findOne({ iteration_query: subfeatures });
  console.log('Similar sequences :', similarSequences);

  return {
    loading,
    gene,
    similarSequences,
  };
}

function TopBarSequence({ length, scale }) {
  const range = scale.range();
  const [start, end] = scale.domain();
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
      <b>{descChar}</b>
      {
        isMaxChar
          ? (
            <button
              type="button"
              className="is-link"
              onClick={() => setDesc(!openDesc)}
            >
              <small>{buttonText}</small>
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
      {id}
    </a>
  );
}

function PourcentageView({ length_hit, length_sequence }) {
  const pourcentage = ((length_hit / length_sequence) * 100).toFixed(2);
  return (
    <p>{length_hit}/{length_sequence} ({pourcentage}%)</p>
  );
}

function PairwiseAlignmentView({
  algorithm,
  seqFrom,
  seqTo,
  hitFrom,
  hitTo,
  queryseq,
  hitmidline,
  hitseq,
}) {
  console.log('coucou seqFrom :', seqFrom);
  let pairwiseAlignmt = '';
  const maxSplit = 60;

  for (let i = 0; i < Math.floor(queryseq.length / maxSplit) + 1; i += 1) {
    // Align query sequence.
    pairwiseAlignmt += 'Query ';
    const maxSpaceCount = queryseq.length.toString().length;
    let minSpaceCount;
    if (algorithm === 'blastx') {
      minSpaceCount = ((Number(seqFrom) + (i * maxSplit * 3)).toString().length);
    } else if (algorithm === 'blastp') {
      minSpaceCount = ((Number(seqFrom) + (i * maxSplit)).toString().length);
    }

    const repeatSpace = (maxSpaceCount - minSpaceCount + 1);

    // query from.
    if (algorithm === 'blastx') {
      pairwiseAlignmt += Number(seqFrom) + (i * maxSplit * 3);
    } else if (algorithm === 'blastp') {
      pairwiseAlignmt += Number(seqFrom) + (i * maxSplit);
    }

    pairwiseAlignmt += ' '.repeat(repeatSpace);
    pairwiseAlignmt += ' ';
    pairwiseAlignmt += queryseq.slice((i * maxSplit), ((i + 1) * maxSplit));
    pairwiseAlignmt += ' ';

    // query to.
    if (((i + 1) * maxSplit) >= queryseq.length) {
      pairwiseAlignmt += seqTo;
    } else {
      if (algorithm === 'blastx') {
        // 1 codon = 3 nucleotides.
        pairwiseAlignmt += (Number(seqFrom) + ((i + 1) * maxSplit * 3) - 1);
      } else if (algorithm === 'blastp') {
        pairwiseAlignmt += (Number(seqFrom) + ((i + 1) * maxSplit) - 1);
      }
    }
    pairwiseAlignmt += '\n';

    // Align midline sequence.
    console.log(7 + minSpaceCount + repeatSpace);
    pairwiseAlignmt += ' '.repeat(7 + minSpaceCount + repeatSpace);
    const b = hitmidline.slice((i * maxSplit), ((i + 1) * maxSplit));
    console.log(b);
    console.log(i * maxSplit);
    console.log((i + 1) * maxSplit);
    console.log('test 1:', hitmidline.slice(1, 60));
    console.log('test 2:', hitmidline.slice(i * maxSplit), 60);
    console.log('entire midline :', hitmidline);
    pairwiseAlignmt += hitmidline.slice((i * maxSplit), ((i + 1) * maxSplit));
    pairwiseAlignmt += '\n';

    // Align hit sequence also called subject sequence (Sbjct).
    pairwiseAlignmt += 'Sbjct ';
    const maxHitSpace = hitseq.length.toString().length;
    const minHitSpace = ((Number(hitFrom) + (i * maxSplit)).toString().length);
    const hitRepeatSpace = (maxHitSpace - minHitSpace + 1);

    let dashHit;
    if (i === 0) {
      dashHit = 0;
    } else {
      dashHit = (hitseq.slice(0, ((i) * maxSplit))).split('-').length;
    }

    // hit from.
    if (i === 0) {
      pairwiseAlignmt += Number(hitFrom);
    } else {
      pairwiseAlignmt += ((Number(hitFrom) + (i * maxSplit) - dashHit) + 1);
    }
    pairwiseAlignmt += ' '.repeat(hitRepeatSpace);
    pairwiseAlignmt += ' ';
    const subjctSeq = hitseq.slice((i * maxSplit), ((i + 1) * maxSplit));
    const subjctVoid = hitseq.slice(0, ((i + 1) * maxSplit)).split('-').length; // count the number of dashes.
    pairwiseAlignmt += subjctSeq;
    pairwiseAlignmt += ' ';

    // hit to.
    if (((i + 1) * maxSplit) >= hitseq.length) {
      pairwiseAlignmt += hitTo;
    } else {
      pairwiseAlignmt += (Number(hitFrom) + ((i + 1) * maxSplit - subjctVoid));
    }
    pairwiseAlignmt += '\n\n';
  }
  return (
    <pre style={{ padding: '.25em .5em', lineHeight: '1', display: 'block', maxWidth: '600px', height: 'auto' }}>
      {pairwiseAlignmt}
    </pre>
  );
}

function HitIntervalinfo({
  algorithm,
  id,
  identical_proteins,
  def,
  accession,
  accession_length,
  score,
  bit_score,
  evalue,
  identity,
  positive,
  gaps,
  query_seq,
  query_len,
  midline,
  query_from,
  query_to,
  hit_from,
  hit_to,
  hit_seq,
}) {
  return (
    <div className="panel-body">
      <table className="table is-hoverable is-narrow is-small">
        <tbody>
          <tr>
            <td colSpan="2" style={{ width: '600px' }}>
              <DescriptionLimited description={def} />
            </td>
          </tr>
          <tr>
            <td>Sequence ID :</td>
            <td>
              <SequenceID id={id} />
            </td>
          </tr>
          {
            identical_proteins &&
              <tr>
                <td>Identical proteins :</td>
                {
                  identical_proteins.map(id_protein => (
                    <td key={id_protein.id.toString()}>
                      <SequenceID id={id_protein.id} />
                    </td>
                  ))
                }
              </tr>
          }
          <tr>
            <td>Accession :</td>
            <td>{accession}</td>
          </tr>
          <tr>
            <td>Length :</td>
            <td>{accession_length}</td>
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
              <PourcentageView length_hit={identity} length_sequence={query_len} />
            </td>
          </tr>
          <tr>
            <td>Positive :</td>
            <td>
              <PourcentageView length_hit={positive} length_sequence={query_len} />
            </td>
          </tr>
          <tr>
            <td>Gaps :</td>
            <td>
              <PourcentageView length_hit={gaps} length_sequence={query_len} />
            </td>
          </tr>
        </tbody>
      </table>
      <PairwiseAlignmentView
        algorithm={algorithm}
        seqFrom={query_from}
        seqTo={query_to}
        hitFrom={hit_from}
        hitTo={hit_to}
        queryseq={query_seq}
        hitmidline={midline}
        hitseq={hit_seq}
      />
    </div>
  );
}

function HitsCoverLines({ query, scale, height }) {
  const range = scale.range();
  const algorithm = query.algorithm_ref;
  const [start, end] = scale.domain();
  return (
    <svg width={range[1] + 134} height={height + 40}>
      {
        query.iteration_hits.map((hit, index) => {
          const queryHitId = hit.id;
          const posX = scale(hit['query-from']);
          const wRect = (start + scale(hit['query-to']) - scale(hit['query-from']));
          return (
            <g key={queryHitId}>
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
                    algorithm={algorithm}
                    id={hit.id}
                    identical_proteins={hit.identical_proteins}
                    def={hit.def}
                    accession={hit.accession}
                    accession_length={hit.accession_len}
                    score={hit.score}
                    bit_score={hit['bit-score']}
                    evalue={hit.evalue}
                    identity={hit.identity}
                    positive={hit.positive}
                    gaps={hit.gaps}
                    query_seq={hit['query-seq']}
                    query_len={hit.length}
                    midline={hit.midline}
                    query_from={hit['query-from']}
                    query_to={hit['query-to']}
                    hit_from={hit['hit-from']}
                    hit_to={hit['hit-to']}
                    hit_seq={hit['hit-seq']}
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

function AlgorithmDetails({ algorithm }) {
  let algoDetails = algorithm;
  if (algoDetails === 'blastp') {
    algoDetails = 'blastp (protein-protein BLAST)';
  } else if (algoDetails === 'blastx') {
    algoDetails = 'blastx (nucleotide-protein BLAST)';
  } else {
    algoDetails = algorithm;
  }
  return (
    <p>{algoDetails}</p>
  );
}

function ProgramDetails({ program }) {
  let programDetails = program;
  if (program === 'blast') {
    programDetails = 'BLAST';
  } else if (program === 'diamond') {
    programDetails = 'Diamond';
  }
  return (
    <p>{programDetails}</p>
  );
}

function GlobalInformation({ querySequences, initialWidth = 200 }) {
  const [width, setWidth] = useState(initialWidth);

  const margin = {
    top: 10,
    bottom: 10,
    left: 20,
    right: 20,
  };

  const length = querySequences.query_len;

  const height = ((querySequences.iteration_hits.length + 1) * 20);

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
              <td>Algorithm :</td>
              <td>
                {querySequences.algorithm_ref && <AlgorithmDetails algorithm={querySequences.algorithm_ref} />}
              </td>
            </tr>
            <tr>
              <td>Substitution Matrix :</td>
              <td>
                {querySequences.matrix_ref && <p>{querySequences.matrix_ref}</p>}
              </td>
            </tr>
            <tr>
              <td>Database :</td>
              <td>
                {querySequences.database_ref && <p>{querySequences.database_ref}</p>}
              </td>
            </tr>
            <tr>
              <td>Total hits selected :</td>
              <td>{querySequences.iteration_hits.length}</td>
            </tr>
            <tr>
              <td>Program :</td>
              <td>{querySequences.program_ref && <ProgramDetails program={querySequences.program_ref} />}</td>
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
            <HitsCoverLines query={querySequences} scale={scale} height={height} />
          </div>
        </div>
        <ReactResizeDetector handleWidth onResize={(w) => setWidth(w)} />
      </div>

    </div>
  );
}

function SequenceSimilarity({ showHeader = false, similarSequences }) {
  return (
    <>
      {showHeader && <Header />}
      <div>
        <GlobalInformation querySequences={similarSequences} />
      </div>
    </>
  );
}

export default compose(
  withTracker(SequenceSimilarityDataTracker),
  branch(hasNoSequenceSimilarity, NoSequenceSimilarity),
)(SequenceSimilarity);
