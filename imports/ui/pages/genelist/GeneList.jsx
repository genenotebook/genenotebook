import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Genes } from '/imports/api/genes/gene_collection.js';

import GenemodelContainer from '../feature/Genemodel.jsx';
//import ExpressionPlot from '../feature/ExpressionPlot.jsx';
//
import './genelist.scss';

const GeneListComponent = ({gene, selection, selectedAll, updateSelection }) => {
  const active = selectedAll || selection.has(gene.ID) ? ' active' : '';
  return (
    <li className="list-group-item genelist-item">
      <button 
        type="button" 
        className={ "btn btn-sm btn-outline-secondary select-gene pull-right" + active }
        id={gene.ID}
        onClick={updateSelection.bind(this)} >
        <i className="fa fa-check" aria-hidden="true"></i>
      </button>
      <p>
        <a className="genelink" href={`/gene/${gene.ID}`}>{`${gene.ID}`}</a>
        {
          gene.attributes.Name && <b> {` ${gene.attributes.Name}`} </b>
        }
        {
          gene.attributes.Note && ` ${gene.attributes.Note}`
        }
      </p>
        <GenemodelContainer gene={gene} />
    </li>
  )
}

class GeneList extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const { genes, loading, selection, updateSelection, selectedAll } = this.props;
    return (
      <ul className="genelist list-group">
      {
        this.props.genes.map(gene => {
          return <GeneListComponent 
            key={gene.ID} 
            gene={gene} 
            selection={selection}
            selectedAll={selectedAll}
            updateSelection={updateSelection} />
        })
      }
     </ul>
    )
  }
}

export default withTracker(({ query, scrollLimit, selection, updateSelection, selectedAll }) => {
  const geneSub = Meteor.subscribe('genes', scrollLimit, undefined, query)
  const loading = geneSub.ready();

  const genes = Genes.find(query).fetch();
  
  return { genes, loading, selection, updateSelection, selectedAll }
})(GeneList)
