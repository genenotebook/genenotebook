import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { removeAnnotationTrack } from '/imports/api/genomes/removeAnnotationTrack.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import { BlastDB } from './BlastDB.jsx';


const hasNoAnnotation = ({ annotationTrack }) => {
  return typeof annotationTrack === 'undefined';
}

const NoAnnotation = () => {
  return <button type="button" className="btn btn-outline-secondary btn-sm px-2 py-0" disabled>
    <i className="fa fa-ban" /> No annotation
  </button> 
}

const withConditionalRendering = compose(
  withEither(hasNoAnnotation, NoAnnotation)
)

class AnnotationInfo extends React.Component {
  removeAnnotationTrack = event => {
    const genomeId = event.target.id;
    console.log(`removeAnnotationTrack ${genomeId}`)
    removeAnnotationTrack.call({ genomeId }, (err, res) => {
      if (err) {
        console.log(err)
        alert(err)
      }
    })
  }
  render(){
    const { annotationTrack, genomeId, isEditing } = this.props;
    const { name, blastdbs } = annotationTrack;
    return <table style={{width:'100%'}}>
      <tbody>
        <tr title={name}>
          <td>{ name.substring(0,10) + '...' }</td>
        </tr>
        <tr>
          <td>
            <BlastDB {...this.props} />
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
                <i className="fa fa-exclamation-circle" /> Delete annotation <i className="fa fa-exclamation-circle" />
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
}

export default withConditionalRendering(AnnotationInfo);