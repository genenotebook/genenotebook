import React from 'react';


const HitPlotLine = (props) => {
  const hsps = props.hit.Hit_hsps;
  return (
    <g transform={`translate(0,${props.index * 10})`}>
      {
        hsps.map((_hsp, index) => {
          const hsp = _hsp.Hsp[0];
          return (
            <rect x = {index * 10} y = '0' width = '5' height = '5' />
          )
        })
      }
    </g>
  )
}

export default class BlastResultPlot extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    const hits = this.props.blastResult.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
    return (
      <div className='blast-result-plot'>
        BLASTRESULTPLOT
        <svg>
          {
            hits.map((hit,index) => {
              return (
                <HitPlotLine hit = {hit} index = {index}/>
              )
            })
          }
        </svg>
      </div>
    )
  }
}