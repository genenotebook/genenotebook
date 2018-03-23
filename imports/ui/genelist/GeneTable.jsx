import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import GeneTableHeader from './GeneTableHeader.jsx';

import GenemodelContainer from '../feature/Genemodel.jsx';
import ExpressionPlot from '../feature/ExpressionPlot.jsx';
import SampleSelection from '../feature/SampleSelection.jsx';

/**
 * Reactive Meteor tracker for GeneTable component
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

const GeneTableRow = ({gene, selectedColumns, selectedAllGenes, selectedGenes, updateSelection }) => {
  const selected = selectedAllGenes || selectedGenes.has(gene.ID)
  const active = selected ? ' active' : '';
  return (
    <tr>
      <td>
        <a className='genelink' href={`/gene/${gene.ID}`}>
          {gene.ID}
        </a>
      </td>
      {
        Array.from(selectedColumns).map(columnName => {
          return (
            <td key={columnName}>
              {gene.attributes[columnName]}
            </td>
          )
        })
      }
      {/*<td>
      
        <SampleSelection gene={gene}>
          <ExpressionPlot gene={gene} />
        </SampleSelection>
      
      </td>
      */}
      <td>
        <button 
          type="button" 
          className={ "btn btn-sm btn-outline-secondary pull-right" + active }
          id={gene.ID}
          onClick={updateSelection.bind(this)} >
          <span id={gene.ID} className="fa fa-check" aria-hidden="true" />
        </button>
      </td>
    </tr>
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
    const { genes, ...props } = this.props;
    return (
      <div className="table-responsive">
        <table className="genelist table table-hover table-sm">
          <GeneTableHeader {...props}/>
          <tbody>
          {
            this.props.genes.map(gene => {
              return <GeneTableRow key={gene.ID} gene={gene} {...props} />
            })
          }
          </tbody>
       </table>
      </div>
    )
  }
}

export default withConditionalRendering(GeneTable)
