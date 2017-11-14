import React from 'react';

import GeneListSidePanel from './GeneListSidePanel.jsx';
import GeneListNavBar from './GeneListNavBar.jsx';
import GeneList from './GeneList.jsx';

export default class GeneListWithOptions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      scrollLimit: 100,
      query: {},
      selectedGenes: []
    }
  }

  increaseScrollLimit = () => {
    this.setState({
      scrollLimit: this.state.scrollLimit + 100
    })
  }

  updateQuery = event => {

  }

  updateSelection = event => {

  }

  render(){
    console.log(this.state)
    return (
      <div className="genelist row">
        <div className="col-4">
          <GeneListSidePanel updateQuery={this.updateQuery} />
        </div>
        <div className="col">
          <GeneListNavBar 
            queryCount={0} 
            selection={this.state.selectedGenes} />
          <GeneList 
            scrollLimit={this.state.scrollLimit} 
            query={this.state.query} 
            updateSelection={this.updateSelection} />
        </div>
      </div>
    )
  }
}
