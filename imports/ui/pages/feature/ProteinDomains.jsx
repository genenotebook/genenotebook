import React from 'react';
import { scaleLinear } from 'd3-scale';
import ContainerDimensions from 'react-container-dimensions';
import { groupBy } from 'lodash';

const ProteinDomainSourceGroup = ({source, domains, index}) => {
  console.log(index,source,domains)
  return (
    <g transform={`translate(0,${index * domains.length * 10})`}>
      {
        domains.map((domain, domainIndex) => {
          return (
            <rect 
              transform={`translate(0,${domainIndex * 10})`} 
              x={domain.start}
              width={domain.end - domain.start}
              y='0'
              height='8'
              key={domain.start} />
          )
        })
      }
    </g>
  )
}

export default class ProteinDomains extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    const transcripts = this.props.gene.subfeatures.filter(sub => sub.type === 'mRNA');
    const transcript = transcripts[0];
    const domainsBySource = groupBy(transcript.protein_domains, 'source');
    console.log(domainsBySource)
    
    return (
      <div id="protein-domains">
        <hr />
        <h3>Protein domains</h3>
        <div className="card protein-domains-container">
          <ContainerDimensions>
          {
            ({width, height}) => {
              return (
                <svg width={width} height='350'>
                  {
                    Object.entries(domainsBySource).map((domainGroup, index) => {
                      const [source, domains] = domainGroup;
                      return <ProteinDomainSourceGroup 
                        key={source} 
                        source={source} 
                        domains={domains} 
                        index={index} />
                    })
                  }
                </svg>
              )
            }
          }
          </ContainerDimensions>
        </div>
      </div>
    )
  }
}