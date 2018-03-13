import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import './landingpage.scss';

export default class Landingpage extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <div className="container">
        <div className="jumbotron">
          <h2 >Welcome to the </h2>
          <h1 >Parasponia Genebook</h1>
          <p>
            This is the central resource for comparative genomics of <i>Parasponia andersonii</i> and <i>Trema orientalis</i>.<br/>
            It includes all Genebook functionality, and allows downloading of various data.
          </p>
          <p>
            <a href="/register" className="btn btn-success">
              <i className="fa fa-user-plus" aria-hidden="true"></i> Create an account
            </a>
            <a href="/login" className="btn btn-primary">
              <i className="fa fa-sign-in" aria-hidden="true"></i> Sign in
            </a>
            <a href="http://genebook.readthedocs.io/" className="btn btn-outline-dark">
              <i className="fa fa-github" aria-hidden="true"></i> About Genebook
            </a>
          </p>
        </div>

        <div className="card-deck">

          <div className="card bg-light text-center mb-3">
            <div className="card-body">
              <img src="/svg/008-menu.svg" alt="" />
              <h3 className="card-title">
                Gene list
              </h3>
              <h6 className="card-subtitle mb-2 text-muted">
                Browse through a list of genes with customizable queries
              </h6>
              <a href="/genes" className="btn btn-dark btn-sm">
                <i className="fa fa-list-ul" aria-hidden="true"></i> Browse
              </a> 
            </div>
          </div>

          <div className="card bg-light text-center mb-3">
            <div className="card-body">
              <img src="/svg/007-loupe.svg" alt="" />
            
              <h3 className="card-title">
                Advanced search
              </h3>
              <h6 className="card-subtitle mb-2 text-muted">
                Search genomes, genes, experiments, meta-data etc.
              </h6>
              <a href="#" className="btn btn-dark btn-sm">
                <i className="fa fa-search" aria-hidden="true"></i> Search
              </a> 
            </div>
          </div>

          <div className="card bg-light text-center mb-3">
            <div className="card-body">
              <img src="/svg/001-server.svg" alt="" />
              <h3 className="card-title">
                BLAST
              </h3>
              <h6 className="card-subtitle mb-2 text-muted">
                BLAST your protein or DNA sequence to full genomes and annotations 
              </h6>
              <a href="/blast" className="btn btn-dark btn-sm">
                <i className="fa fa-server" aria-hidden="true"></i> Blast
              </a>
            </div>
          </div>

        </div>
      </div>
    )
  }
};
