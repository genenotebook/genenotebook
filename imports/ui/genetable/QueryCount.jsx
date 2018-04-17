import React from 'react';

import { queryCount } from '/imports/api/methods/queryCount.js';

export default class QueryCount extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      queryCount: '...'
    }
  }

  componentDidMount = () => {
    const { query, ...props } = this.props;
    queryCount.call({query}, (err, queryCount) => {
      if (err) console.error(err)
      this.setState({
        queryCount
      })
    })
  }

  componentWillReceiveProps = ({ query, ...nextProps }) => {
    queryCount.call({ query }, (err, res) => {
      console.log(err,res)
      this.setState({
        queryCount: res
      })
    })
  }
  render(){
    return (
      <button type='button' className='btn btn-sm btn-outline-dark' disabled>
        <span className='badge badge-light'>{this.state.queryCount}</span> query results
      </button>
    )
  }
}