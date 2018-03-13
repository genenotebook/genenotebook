import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

const Status = (props) => {
  let labelClass = 'badge ';
  switch(props.status){
    case 'completed':
      labelClass += 'badge-success'
      break
    case 'cancelled':
      labelClass += 'badge-warning'
      break
    case 'failed':
      labelClass += 'badge-danger'
      break
    case 'running':
      labelClass += 'badge-primary'
      break
    default:
      labelClass += 'badge-light'
  }
  return (
    <span className={labelClass}> {props.status} </span>
  )
}

export const JobProgressBar = ({ job, loading }) => {
  if (loading){
    return null
  }
  //rounding can make a percentage of 100 while job is not finished, 99% looks better in that case
  let percent = Math.round(job.progress.percent)
  if (percent === 100){
    percent -= 1
  }
  return (
    <div className = 'progress'>
      <div 
        className = 'progress-bar progress-bar-default'
        role = 'progressbar'
        aria-valuenow = {percent}
        aria-valuemin='0'
        aria-valuemax='100'
        style={{width:`${percent}%`}}
      >
        {`${percent}%`}
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
                  <Status status={job.status} />
                  &nbsp;{job.type}
                  <small>
                    &nbsp;job
                    <a href={`/admin/job/${job._id}`}>
                      &nbsp;{job._id}
                    </a>
                  </small>
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
                      <JobProgressBar job = {job} />
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