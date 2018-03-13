import React from 'react';
import { cloneDeep } from 'lodash';

import GeneListSidePanel from './GeneListSidePanel.jsx';
import GeneListNavBar from './GeneListNavBar.jsx';
import GeneList from './GeneList.jsx';
import DownloadDialogModal from './downloads/DownloadDialog.jsx';

export default class GeneListWithOptions extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      scrollLimit: 100,
      query: {},
      queryCount: 0,
      selectedGenes: new Set(),
      selectedAll: false,
      showDownloadDialog: false
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
    this.setState({
      query: newQuery,
      scrollLimit: 100
    })
  }

  updateSelection = event => {
    const geneId = event.target.id;
    const selectedGenes = cloneDeep(this.state.selectedGenes);
    if (!selectedGenes.has(geneId)){
      selectedGenes.add(geneId)
    } else {
      selectedGenes.delete(geneId)
    }
    this.setState({
      selectedGenes: selectedGenes
    })
  }

  selectAll = selectAll => {
    const newState = { selectedGenes: new Set() };
    const selectedGenes = Array.from(this.state.selectedGenes)
    if (selectedGenes.length > 0){
      newState.selectedAll = false
    } else {
      newState.selectedAll = selectAll
    }
    this.setState(newState)
  }

  toggleDownloadDialog = () => {
    this.setState({
      showDownloadDialog: !this.state.showDownloadDialog
    })
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
            selection={this.state.selectedGenes}
            selectedAll={this.state.selectedAll}
            selectAll={this.selectAll}
            openDownloadDialog={this.toggleDownloadDialog} />
          <GeneList 
            scrollLimit={this.state.scrollLimit} 
            query={this.state.query} 
            updateSelection={this.updateSelection}
            selection={this.state.selectedGenes}
            selectedAll={this.state.selectedAll} />
        </div>
        <DownloadDialogModal 
          show={this.state.showDownloadDialog} 
          onClose={this.toggleDownloadDialog} 
          query={this.state.query}
          selectedAll={this.state.selectedAll}
          selectedGenes={this.state.selectedGenes} />
      </div>
    )
  }
}
