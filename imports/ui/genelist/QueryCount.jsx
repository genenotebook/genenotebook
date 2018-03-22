import React from 'react';

export default class QueryCount extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      queryCount: '...'
    }
  }
  componentWillReceiveProps = nextProps => {
    //queryCount.call(nextprops.query, (err, res) => {
    //  this.setState({
    //    queryCount: res
    //  })
    //})
  }
  render(){
    return (
      <button type='button' className='btn btn-sm btn-warning' disabled>
        <span className='badge badge-dark'>{this.state.queryCount}</span> query results
      </button>
    )
  }
}