import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { compose } from 'recompose';
import React from 'react';
import { cloneDeep } from 'lodash';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';
import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';

const genomeDataTracker = ({...props}) => {
  const genomeSub = Meteor.subscribe('genomes');
  const loading = !genomeSub.ready();
  const genomes = genomeCollection.find({ annotationTrack: { $exists: true } }).fetch();
  return {
    loading,
    genomes,
    ...props
  }
}

const withConditionalRendering = compose(
  withTracker(genomeDataTracker),
  withEither(isLoading, Loading)
)

class GenomeSelect extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      initialized: false,
      show: '',
      selectedGenomes: new Set()
    }
  }

  componentWillReceiveProps = newProps => {
    if (!this.state.initialized){
      const genomes = newProps.genomes.map(genome => genome._id);
      this.setState({
        selectedGenomes: new Set(genomes),
        initialized: true
      })
    }
  }

  open = () => {
    console.log('open')
    this.setState({
      show: 'show'
    });
    document.addEventListener('click', this.close);
  }

  close = () => {
    this.setState({
      show: ''
    });
    document.removeEventListener('click', this.close);
  }

  /*preventClose = event => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }*/

  toggleGenomeSelect = event => {
    const selectedGenomes = cloneDeep(this.state.selectedGenomes);
    const query = cloneDeep(this.props.query);
    const genomeId = event.target.id;
    if (selectedGenomes.has(genomeId)){
      selectedGenomes.delete(genomeId)
    } else {
      selectedGenomes.add(genomeId)
    }
    
    this.setState({ selectedGenomes });

    if (selectedGenomes.size < this.props.genomes.length){
      query.genomeId = { $in: [...selectedGenomes]}
    } else if (query.hasOwnProperty('genomeId')){
      delete query.genomeId;
    }

    this.props.updateQuery(query);
  }

  selectAll = () => {
    const allGenomes = this.props.genomes.map(genome => genome._id);
    const selectedGenomes = new Set(allGenomes)
    const query = cloneDeep(this.props.query);
    this.setState({ selectedGenomes });

    if (query.hasOwnProperty('genomeId')){
      delete query.genomeId
    }
    this.props.updateQuery(query)
  }

  unselectAll = () => {
    const query = cloneDeep(this.props.query);
    const selectedGenomes = new Set([]);
    this.setState( selectedGenomes );
    query.genomeId = { $in: [] }
    this.props.updateQuery(query)
  }

  render(){
    const { genomes, ...props } = this.props;
    const { selectedGenomes } = this.state;
    return ( 
      <Dropdown>
        <DropdownButton className='btn btn-sm btn-outline-dark dropdown-toggle px-2 py-0 border'>
          Genomes&nbsp;
          <span className='badge badge-dark'>
            {`${selectedGenomes.size}/${genomes.length}`}
          </span>
        </DropdownButton>
        <DropdownMenu>
          <h6 className="dropdown-header">Select genomes</h6>
          {
            genomes.map(({ _id, name }) => {
              const checked = selectedGenomes.has(_id);
              return (
                <div key={`${_id}-${checked}`} className='form-check'>
                  <input type='checkbox' className='form-check-input' id={_id}
                    checked={checked} onChange={this.toggleGenomeSelect} />
                  <label className='form-check-label'>{name}</label>
                </div>
              )
            })
          }
          <div className="dropdown-divider" />
          <div className="btn-group mx-2" role="group">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-dark" 
              onClick={this.selectAll}>
              Select all
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-dark"
              onClick={this.unselectAll}>
              Unselect all
            </button>
          </div>
        </DropdownMenu>
      </Dropdown>
      
    )
  }
}

export default withConditionalRendering(GenomeSelect);

