import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import GenomeInfo from './GenomeInfo.jsx';

const adminGenomesDataTracker = () => {
  const subscription = Meteor.subscribe('genomes');
  const loading = !subscription.ready();
  const genomes = genomeCollection.find({}).fetch();
  return {
    genomes,
    loading
  }
}

const withConditionalRendering = compose(
  withTracker(adminGenomesDataTracker),
  withEither(isLoading, Loading)
)

const AdminGenomes = ({ genomes }) => {
  return (
    <div className="mt-2">
      <table className="table table-hover table-sm">
        <thead>
          <tr>
            {
              ['Reference name','Organism','Description','Permissions','Annotation track','Actions'].map(label => {
                return <th key={label} id={label}>
                  <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
                    {label}
                  </button>
                </th>
              })
            }
          </tr>
        </thead>
        <tbody>
          {
            genomes.map(genome => {
              return <GenomeInfo key={genome._id} genome={genome} />
            })
          }
        </tbody>
      </table>
    </div>
  )
}


export default withConditionalRendering(AdminGenomes)