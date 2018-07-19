import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { removeAnnotationTrack } from '/imports/api/genomes/removeAnnotationTrack.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import { BlastDB } from './BlastDB.jsx';


const hasNoAnnotation = ({ name, ...props }) => {
  return typeof name === 'undefined';
}

const NoAnnotation = () => {
  return <button type="button" className="btn btn-outline-secondary btn-sm px-2 py-0" disabled>
    <i className="fa fa-ban" /> No annotation
  </button> 
}

const withConditionalRendering = compose(
  withEither(hasNoAnnotation, NoAnnotation)
)

class AnnotationInfo extends React.PureComponent {
  removeAnnotationTrack = event => {
    const genomeId = event.target.id;
    removeAnnotationTrack.call({ genomeId }, (err, res) => {
      if (err) {
        console.log(err)
        alert(err)
      }
    })
  }

  render(){
    const { genomeId, isEditing, name, blastDb } = this.props;
    return <table style={{width:'100%'}}>
      <tbody>
        <tr title={name}>
          <td>{ name.substring(0,10) + '...' }</td>
        </tr>
        <tr>
          <td>
            <BlastDB genomeId={genomeId} isEditing={isEditing} name={name} blastDb={blastDb} />
          </td>
        </tr>
        {
          isEditing && 
          <tr>
            <td>
              <button 
                type='button' 
                className='btn btn-danger btn-sm px-2 py-0 btn-block'
                onClick={ this.removeAnnotationTrack }
                id={genomeId}>
                <i className="fa fa-exclamation" /> Delete annotation
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
}

export default withConditionalRendering(AnnotationInfo);