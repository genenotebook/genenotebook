import React from 'react';

const AlignmentText = (props) => {
  const hsp = props.hsp;
  const queryStart = hsp['Hsp_query-from'][0];
  const hspStart = hsp['Hsp_hit-from'][0];

  const queryPaddingSize = queryStart.length >= hspStart.length ? 0 : hspStart.length - queryStart.length;
  const midLinePaddingSize = Math.max(queryStart.length,hspStart.length);
  const subjectPaddingSize = hspStart.length >= queryStart.length ? 0 : queryStart.length - hspStart.length;

  const queryPadding = ' '.repeat(queryPaddingSize + 3);
  const midLinePadding = ' '.repeat(midLinePaddingSize + 8);
  const subjectPadding = ' '.repeat(subjectPaddingSize + 1);

  const queryTag = 'Query' + queryPadding + queryStart;
  const subjectTag = 'Subject' + subjectPadding + hspStart;

  const querySeq = hsp['Hsp_qseq'][0]
  const midLineSeq = hsp['Hsp_midline'][0]
  const subjectSeq = hsp['Hsp_hseq'][0]
  return (
    <pre className='well alignment-text'>
      <p>
        {queryTag} {querySeq} <br/>
        {midLinePadding} {midLineSeq} <br/>
        {subjectTag} {subjectSeq}
      </p>
    </pre>
  )
}

const HitLine = (props) => {
  const hit = props.hit;
  const [gene, transcript] = hit.Hit_def[0].split(' ')
  return (
    <div>
      <a href={`/gene/${gene}`}> {transcript} </a>
      <small>
        <b>E-value:</b> {hit.Hit_hsps[0].Hsp[0].Hsp_evalue[0]}
      </small>
      <ul className='list-group'>
        {
          hit.Hit_hsps.map(_hsp => {
            const hsp = _hsp.Hsp[0]
            return (
              <li className='list-group-item' key={hsp.Hsp_evalue[0]}>
                <AlignmentText hsp={hsp} />
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}

export default class BlastResultList extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    const hits = this.props.blastResult.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
    return (
      <ul className='list-group'>
      {
        hits.map(hit => {
          return (
            <li className='list-group-item' key={hit.Hit_id[0]}>
              <HitLine hit={hit} />
            </li>
          )
        })
      }
      </ul>
    )
  }
}