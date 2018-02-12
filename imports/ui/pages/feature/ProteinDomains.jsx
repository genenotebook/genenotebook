import React from 'react';
import { scaleLinear } from 'd3-scale';
import ContainerDimensions from 'react-container-dimensions';
import { groupBy } from 'lodash';

const ProteinDomainSourceGroup = ({domains, index}) => {
  console.log(index,domains)
  return (
    <g>
      {
        domains.map(domain => {
          return (
            <rect>
            </rect>
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
                    Object.entries(domainsBySource).map((domains, index) => {
                      return <ProteinDomainSourceGroup domains={domains} index={index}/>
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