import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { scanGeneAttributes } from '/imports/api/genes/scanGeneAttributes.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

const attributeDataTracker = () => {
  const attributeSub = Meteor.subscribe('attributes');
  const attributes = attributeCollection.find({}).fetch();
  const genomeSub = Meteor.subscribe('genomes');
  const genomes = genomeCollection.find({}).fetch();
  const loading = !attributeSub.ready() || !genomeSub.ready();
  return {
    attributes,
    genomes,
    loading
  }
}

const withConditionalRendering = compose(
  withTracker(attributeDataTracker),
  withEither(isLoading, Loading)
)

class AdminAttributes extends React.Component {
  constructor(props){
    super(props)
  }

  scanAttributes = (event) => {
    event.preventDefault();
    console.log('clicked scanAttributes')
    this.props.genomes.forEach(genome => {
      console.log(genome)
      const genomeId = genome._id;
      scanGeneAttributes.call({ genomeId });
    })
  }

  render(){
    const { attributes, ...props } = this.props;
    return (
      <div>
        <hr/>
        <button type='button' className='btn btn-warning' onClick={this.scanAttributes}>
          <span className="icon-exclamation" aria-hidden="true"/> Scan all genes for attributes
        </button>
        <hr/>
        <table className="table table-hover table-sm">
          <thead>
          <tr>
            {
              ['Name','Query','Visible','Can edit','References','Actions'].map(label => {
                return <th key={label} scope='col'>
                  <button type='button' className='btn btn-sm btn-outline-dark py-0 px-2' disabled>
                    { label }
                  </button>
                </th>
              })
            }
          </tr>
        </thead>
        <tbody>
        {
          attributes.map(attribute => {
            return (
              <tr key={attribute._id}>
                <td>{attribute.name}</td>
                <td>{attribute.query}</td>
                <td>{attribute.show}</td>
                <td>{attribute.canEdit}</td>
                <td>{attribute.references ? attribute.references : attribute.allReferences}</td>
                <td>
                  <button type='button' className='btn btn-sm btn-outline-dark py-0 px-2'>Edit</button>
                </td>
              </tr>
            )
          })
        }
        </tbody>
        </table>
      </div>
    )
  }
}

export default withConditionalRendering(AdminAttributes);


