import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import GenemodelContainer from '../feature/Genemodel.jsx';
import ExpressionPlot from '../feature/ExpressionPlot.jsx';
import SampleSelection from '../feature/SampleSelection.jsx';

/**
 * Reactive Meteor tracker for GeneTabel component
 * @param  {Object} options.query           [description]
 * @param  {Number} options.scrollLimit     [description]
 * @param  {Set} options.selectedGenes   [description]
 * @param  {Function} options.updateSelection [description]
 * @param  {Boolean} options.selectedAll     [description]
 * @return {Object}                         [description]
 */
const dataTracker = ({ query, scrollLimit, selectedGenes, updateSelection, selectedAll }) => {
  const geneSub = Meteor.subscribe('genes', {
    limit: scrollLimit, 
    search: undefined, 
    query: query
  })
  const loading = !geneSub.ready();
  const genes = Genes.find(query).fetch();
  
  return { genes, loading, selectedGenes, updateSelection, selectedAll }
}


const hasNoResults = props => {
  return props.genes.length === 0
}


const NoResults = props => {
  return (
    <div>
      No results
    </div>
  )
}



const withConditionalRendering = compose(
    withTracker(dataTracker),
    withEither(isLoading, Loading),
    withEither(hasNoResults, NoResults)
  )


const GeneTableRow = ({gene, selected, updateSelection }) => {
  const active = selected ? ' active' : '';
  return (
    <tr>
      <td>
        <a className='genelink' href={`/gene/${gene.ID}`}>
          {gene.ID}
        </a>
      </td>
      <td>{gene.attributes.Name}</td>
      <td>{gene.attributes.Note}</td>
      <td>
      {/*
        <SampleSelection gene={gene}>
          <ExpressionPlot gene={gene} />
        </SampleSelection>
      */}
      </td>
      <td>
        <button 
          type="button" 
          className={ "btn btn-sm btn-outline-secondary select-gene pull-right" + active }
          id={gene.ID}
          onClick={updateSelection.bind(this)} >
          <span className="fa fa-check" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}


const GeneTableHeader = props => {
  return (
    <thead>
      <tr>
        <th scope="col">Gene ID <span className="fa fa-sort" /></th>

        <th scope="col">Name</th>
        <th scope="col">Product</th>
        <th scope="col">Expression</th>

        <th scope="col"><div className="pull-right">Select</div></th>
      </tr>
    </thead>
  )
}

/**
 * 
 */
class GeneTable extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const { genes, loading, selectedGenes, updateSelection, selectedAll } = this.props;
    return (
      <div className="table-responsive">
        <table className="genelist table table-hover table-sm">
          <GeneTableHeader />
          <tbody>
          {
            this.props.genes.map(gene => {
              const selected = selectedAll || selectedGenes.has(gene.ID)
              return <GeneTableRow 
                key={gene.ID} 
                gene={gene} 
                selected={selected}
                updateSelection={updateSelection} />
            })
          }
          </tbody>
       </table>
      </div>
    )
  }
}

export default withConditionalRendering(GeneTable)
