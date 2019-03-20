import React from 'react';

const AlignmentText = ({ hsp }) => {
  const queryStart = hsp['Hsp_query-from'][0];
  const hspStart = hsp['Hsp_hit-from'][0];

  const queryPaddingSize =    queryStart.length >= hspStart.length
      ? 0
      : hspStart.length - queryStart.length;
  const midLinePaddingSize = Math.max(queryStart.length, hspStart.length);
  const subjectPaddingSize =    hspStart.length >= queryStart.length
      ? 0
      : queryStart.length - hspStart.length;

  const queryPadding = ' '.repeat(queryPaddingSize + 3);
  const midLinePadding = ' '.repeat(midLinePaddingSize + 9);
  const subjectPadding = ' '.repeat(subjectPaddingSize + 1);

  const queryTag = `Query${queryPadding}${queryStart} `;
  const subjectTag = `Subject${subjectPadding}${hspStart} `;

  const querySeq = hsp.Hsp_qseq[0];
  const midLineSeq = hsp.Hsp_midline[0];
  const subjectSeq = hsp.Hsp_hseq[0];
  return (
    <pre className="alignment-text">
      {queryTag}
      {querySeq}
      <br />
      {midLinePadding}
      {midLineSeq}
      <br />
      {subjectTag}
      {subjectSeq}
    </pre>
  );
};

export default function BlastAlignment({ hit }) {
  return (
    <ul className="list-group">
      {hit.Hit_hsps.map((_hsp) => {
        const hsp = _hsp.Hsp[0];
        return (
          <li className="list-group-item border" key={hsp.Hsp_evalue[0]}>
            <AlignmentText hsp={hsp} />
          </li>
        );
      })}
    </ul>
  );
}
