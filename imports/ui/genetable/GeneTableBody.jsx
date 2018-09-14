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
const dataTracker = ({ query = {}, sort = {ID: 1}, limit = 40, selectedGenes, updateSelection, selectedAll }) => {
  console.log(query,sort,limit);
  const geneSub = Meteor.subscribe('genes', { query, sort, limit });
  const loading = !geneSub.ready();
  const genes = Genes.find(query, { limit, sort }).fetch();
  
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


class AttributeValueArray extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showAll: false
    }
  }
  toggleShowAll = event => {
    event.preventDefault();
    this.setState({
      showAll: !this.state.showAll
    });
  }
  render(){
    const maxLength = 2;
    const { showAll } = this.state;
    const { attributeValue } = this.props;
    const values = showAll ? attributeValue : attributeValue.slice(0,maxLength);
    const buttonText = showAll ? 'Show less' : 'Show more ...';
    return <ul className='list-group list-group-flush'>
      {
        values.map(value => {
          return <li key={value} className='list-group-item py-0 px-0'>
            { value }
          </li>
        })
      }
      {
        attributeValue.length > maxLength &&
        <li className='list-group-item py-0 px-0'>
          <a className='px-3' href='#' onClick={this.toggleShowAll}>
            <small>{ buttonText }</small>
          </a>
        </li>
      }
    </ul>
  }
}

class AttributeValueSingle extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showAll: false
    };
  }
  toggleShowAll = event => {
    event.preventDefault();
    this.setState({
      showAll: !this.state.showAll
    })
  }
  render(){
    const maxLength = 100;
    const { showAll } = this.state;
    const attributeValue = String(this.props.attributeValue);
    const value = showAll ? attributeValue : attributeValue.slice(0, maxLength);
    const buttonText = showAll ? 'Show less' : 'Show more ...';
    return <React.Fragment>
      <p className='mb-1'>{ value }</p>
      {
        attributeValue.length > maxLength &&
        <a className='px-3 py-0' href='#' onClick={this.toggleShowAll}>
          <small>{ buttonText }</small>
        </a>
      }
    </React.Fragment>
  }
}

const GeneLink = ({ geneId }) => {
  return <a className='genelink' title={geneId} 
    href={`${Meteor.absoluteUrl()}gene/${geneId}`}>
    { geneId }
  </a>
}

const isArray = ({ attributeValue }) => {
  return Array.isArray(attributeValue) && attributeValue.length > 1
}

/*
export const AttributeValue = ({ attributeValue }) => {
  return Array.isArray(attributeValue) && attributeValue.length > 1 ?
    <AttributeValueArray {...{ attributeValue }} /> :
    String(attributeValue)
}
*/

export const AttributeValue = withEither(isArray, AttributeValueArray)(AttributeValueSingle);

const AttributeColumn = ({ attributeName, attributeValue, geneId }) => {
  return <td data-label={attributeName}>
    {
      attributeName === 'Gene ID' ?
      <GeneLink {...{ geneId }} /> :
      attributeValue && <AttributeValue {...{ attributeValue }} />
    }
  </td>
}

/**
 * [description]
 * @param  {[type]} options.gene             [description]
 * @param  {[type]} options.selectedColumns  [description]
 * @param  {[type]} options.selectedAllGenes [description]
 * @param  {[type]} options.selectedGenes    [description]
 * @param  {[type]} options.updateSelection  [description]
 * @return {[type]}                          [description]
 */
const GeneTableRow = ({ gene, selectedColumns, selectedAllGenes, selectedGenes, 
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
          return <AttributeColumn key={attributeName}
            {...{ attributeName, attributeValue, geneId: gene.ID }} />
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
      this.props.updateScrollLimit(this.props.limit + 50)
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