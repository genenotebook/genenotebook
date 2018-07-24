import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import dot from 'dot-object';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import Genemodel from '../singleGenePage/Genemodel.jsx';
import ProteinDomains from '../singleGenePage/ProteinDomains.jsx';
import ExpressionPlot from '../singleGenePage/ExpressionPlot.jsx';
import SampleSelection from '../singleGenePage/SampleSelection.jsx';
//import Info from '../singleGenePage/Info.jsx';

const ExpressionViz = ({ gene }) => {
  return <SampleSelection gene={gene}>
    <ExpressionPlot />
  </SampleSelection>
} 

const VISUALIZATIONS = {
  'Gene model': Genemodel,
  'Protein domains': ProteinDomains,
  'ExpressionPlot': ExpressionViz
}

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
    sort: {ID: 1}, 
    query: query
  })
  const loading = !geneSub.ready();
  const genes = Genes.find(query).fetch();
  
  return { genes, loading, selectedGenes, updateSelection, selectedAll }
}

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const hasNoResults = ({ genes }) => {
  return typeof genes === 'undefined' || genes.length === 0
}

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const NoResults = ({selectedColumns, ...props}) => {
  const colSpan = selectedColumns.size + 3;
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan}>
          <div className='alert alert-danger' role='alert'>
            Your query returned no results
          </div>
        </td>
      </tr>
    </tbody>
  )
}

/**
 * [description]
 * @param  {[type]} options.genes   [description]
 * @param  {[type]} options.loading [description]
 * @return {[type]}                 [description]
 */
const isLoading = ({genes, loading}) => {
  return loading && genes.length === 0
}

/**
 * [description]
 * @param  {[type]}    options.selectedColumns [description]
 * @param  {...[type]} options.props           [description]
 * @return {[type]}                            [description]
 */
const Loading = ({selectedColumns, ...props}) => {
  const colSpan = selectedColumns.size + 3;
  return (
    <tbody>
    {
      Array(10).fill().map((_,i)=>{
        return (
          <tr key={i}>
            <td colSpan={colSpan}>
              <div className='alert alert-light' role='alert'>
                Loading...
              </div>
            </td>
          </tr>
        )
      })
    }
    </tbody>
  )
}

/**
 * [withConditionalRendering description]
 * @type {[type]}
 */
const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
  withEither(hasNoResults, NoResults)
)

/**
 * [description]
 * @param  {[type]} options.gene             [description]
 * @param  {[type]} options.selectedColumns  [description]
 * @param  {[type]} options.selectedAllGenes [description]
 * @param  {[type]} options.selectedGenes    [description]
 * @param  {[type]} options.updateSelection  [description]
 * @return {[type]}                          [description]
 */
const GeneTableRow = ({gene, selectedColumns, selectedAllGenes, selectedGenes, 
  updateSelection, attributes, selectedVisualization, ...props }) => {
  const selected = selectedAllGenes || selectedGenes.has(gene.ID)
  const color = selected ? 'black' : 'white';
  const selectedAttributes = attributes.filter(attribute => {
    return selectedColumns.has(attribute.name)
  }).reduce((obj, attribute) => {
    obj[attribute.name] = attribute
    return obj
  },{})

  const DataVisualization = VISUALIZATIONS[selectedVisualization];

  return (
    <tr>
      {
        [...selectedColumns].map(attributeName => {
          const attribute = selectedAttributes[attributeName]
          const attributeValue = dot.pick(attribute.query, gene)
          return (
            <td key={attributeName} data-label={attributeName}>
              { 
                attribute.name === 'Gene ID' ?
                <a className='genelink' href={`/gene/${gene.ID}`}>{gene.ID}</a> : 
                attributeValue 
              }
            </td>
          )
        })
      }
      <td data-label={selectedVisualization} style={{width: '20rem'}}>
        <DataVisualization gene={gene} resizable={true} />
        {/*<SampleSelection gene={gene}>
          <ExpressionPlot />
        </SampleSelection>*/}
        
      </td>
      <td>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-dark pull-right px-1 py-0"
          id={gene.ID}
          onClick={updateSelection.bind(this)} >
          <span id={gene.ID} className='icon-check' aria-hidden="true" style={{color}} />
        </button>
      </td>
    </tr>
  )
}


class GeneTableBody extends React.PureComponent {
  constructor(props){
    super(props)
  }
  componentDidMount = () => {
    window.addEventListener('scroll', this.onScroll, false);
  }

  componentWillUnmount = () => {
    window.removeEventListener('scroll', this.onScroll, false);
  }

  onScroll = () => {
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500)){
      this.props.updateScrollLimit(this.props.scrollLimit + 50)
    }
  }
  render(){
    const { genes, ...props } = this.props;
    return (
      <tbody>
        {
          genes.map(gene => {
            return <GeneTableRow key={gene.ID} gene={gene} {...props} />
          })
        }
      </tbody>
    )
  }
}


export default withConditionalRendering(GeneTableBody)