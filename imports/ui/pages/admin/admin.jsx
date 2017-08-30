import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

const Nav = (props) => {
  return (
    <ul className="nav nav-tabs">
      {
        props.pages.map(page => {
          return (
            <li key={page} role="presentation" className={page.toLowerCase() === props.currentPage ? 'active' : null}>
              <a href={`/admin/${page.toLowerCase()}`} name={page.toLowerCase()} onClick={props.changePage}>{ page }</a>
            </li>
          )
        })
      }
    </ul>
  )
}

class Admin extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      currentPage: props.currentPage
    }
  }

  changePage = (event) => {
    this.setState({
      currentPage: event.target.name
    })
  }

  render(){
    console.log(this.state)
    const pages = ['Users','Genomes','Tracks','Experiments','Attributes','Jobs']
    return (
      <div className="container">
        <h3> Admin panel</h3>
        <hr/>
        <Nav pages = { pages } currentPage = {this.state.currentPage} changePage = {this.changePage} />
      </div>
      
    )
  }
}

export default createContainer(() => {
  const page = FlowRouter.getParam('_id')
  return {
    currentPage: page
  }
},Admin)