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
      queryCount: 0,
      selectedGenes: []
    }
  }

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    //http://blog.sodhanalibrary.com/2016/08/detect-when-user-scrolls-to-bottom-of.html
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;
    if (windowBottom >= docHeight){
      this.setState({
        scrollLimit: this.state.scrollLimit + 100
      })
    }
  }

  updateQuery = newQuery => {
    console.log(newQuery)
    this.setState({
      query: newQuery,
      scrollLimit: 100
    })
  }

  updateSelection = event => {

  }

  render(){
    return (
      <div className="genelist row">
        <div className="col-4">
          <GeneListSidePanel
          query={this.state.query}
          updateQuery={this.updateQuery} />
        </div>
        <div className="col">
          <GeneListNavBar 
            queryCount={this.state.queryCount} 
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
