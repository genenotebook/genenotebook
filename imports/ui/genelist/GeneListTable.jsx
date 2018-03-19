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
    <tr>
      <td scope='row'>
        <a className='genelink' href={`/gene/${gene.ID}`}>
          {gene.ID}
        </a>
      </td>
      <td scope='row'>{gene.attributes.Name}</td>
      <td scope='row'>{gene.attributes.Note}</td>
      <td scope='row'>
        
      </td>
      <td scope='row'>
        <button 
          type="button" 
          className={ "btn btn-sm btn-outline-secondary select-gene pull-right" + active }
          id={gene.ID}
          onClick={updateSelection.bind(this)} >
          <i className="fa fa-check" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  )
  /*
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
  */
}

class GeneList extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const { genes, loading, selection, updateSelection, selectedAll } = this.props;
    return (
      <div className="table-responsive">
        <table className="genelist table table-hover table-sm">
          <thead>
            <tr>
              <th scope="col">Gene ID</th>
              <th scope="col">Name</th>
              <th scope="col">Product</th>
              <th scope="col">Gene model</th>
              <th scope="col">Select</th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
       </table>
      </div>
    )
  }
}

export default withTracker(({ query, scrollLimit, selection, updateSelection, selectedAll }) => {
  const geneSub = Meteor.subscribe('genes', scrollLimit, undefined, query)
  const loading = geneSub.ready();
  console.log(query)
  const genes = Genes.find(query).fetch();
  
  return { genes, loading, selection, updateSelection, selectedAll }
})(GeneList)
