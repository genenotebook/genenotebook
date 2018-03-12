import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

const Status = (props) => {
  let labelClass = 'label ';
  switch(props.status){
    case 'completed':
      labelClass += 'label-success'
      break
    case 'cancelled':
      labelClass += 'label-warning'
      break
    case 'failed':
      labelClass += 'label-danger'
      break
    case 'running':
      labelClass += 'label-primary'
      break
    default:
      labelClass += 'label-default'
  }
  return (
    <span className={labelClass}> {props.status} </span>
  )
}

const Progress = (props) => {
  return (
    <div className = 'progress'>
      <div 
        className = 'progress-bar progress-bar-default'
        role = 'progressbar'
        aria-valuenow = {props.progress.percent}
        aria-valuemin='0'
        aria-valuemax='100'
        style={{width:`${props.progress.percent}%`}}
      >
        {`${props.progress.percent}%`}
      </div>
    </div>
  )
} 

class AdminJobqueue extends React.Component {
  constructor(props){
    super(props)
  }

  reRunJob = (event) => {
    jobId = event.target.name
    jobQueue.getJob(jobId, (err, job) => {
      job.rerun();
    });
  }

  render(){
    return (
      this.props.loading ? 
      <div> Loading </div> :
      <div>
        <hr/>
        <ul className='list-group'>
        {
          this.props.jobs.map(job => {
            console.log(job)
            return (
              <li className='list-group-item' key={job._id}>
                <p>
                  {`${job.type} job`}
                  <a href={`/admin/job/${job.ID}`}> {job._id} </a>
                  <Status status={job.status} />
                  <button 
                    type='button' 
                    className='btn btn-default btn-sm pull-right'
                    onClick={this.reRunJob}
                    name={job._id}
                  >Rerun</button>
                </p>
                <ul className='list-group'>
                  <li className='list-group-item'>
                    <small>{`Created: ${job.created}`}</small>
                  </li>
                  <li className='list-group-item'>
                    <small>{`User: ${job.user}`}</small>
                  </li>
                  <li className='list-group-item'>
                    <small>
                      <Progress progress = {job.progress} />
                    </small>
                  </li>
                </ul>
              </li>
            )
          })
        }
        </ul>
      </div>
    )
  }
}

export default withTracker(props => {
  const subscription = Meteor.subscribe('jobQueue')
  return {
    jobs: jobQueue.find({}).fetch(),
    loading: !subscription.ready()
  }
})(AdminJobqueue)