import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Genes } from '/imports/api/genes/gene_collection.js';

const GeneListComponent = ({gene}) => {
  return (
    <li className="list-group-item">
      <button type="button" className="btn btn-sm btn-outline-secondary select-gene pull-right">
        <i className="fa fa-check unchecked" aria-hidden="true"></i>
      </button>
      <p>
        <a className="genelink" href={`/gene/${gene.ID}`}>{`${gene.ID}`}</a>
        {
          gene.attributes.Name && <b> {`${gene.attributes.Name}`} </b>
        }
        {`${gene.attributes.Note}`}
      </p>  
    </li>
  )
}

class GeneList extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    return (
      <ul className="genelist list-group">
      {
        this.props.genes.map(gene => {
          return <GeneListComponent key={gene.ID} gene={gene}/>
        })
      }
     </ul>
    )
  }
}

export default withTracker(props => {
  const geneSub = Meteor.subscribe('genes', props.scrollLimit, undefined, props.query)
  return {
    query: props.query,
    genes: Genes.find(props.query).fetch(),
    loading: !geneSub.ready()
  }
})(GeneList)