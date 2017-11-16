import React from 'react';

class GeneIdSelect extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      sep: '\n'
    }
  }
  parseGeneIds = event => {
    const rawString = event.target.value;
    const rawGeneIds = rawString.split(this.state.sep);
    const geneIds = rawGeneIds.map(geneId => geneId.trim())
    this.props.updateGeneIdFilter(geneIds)
  }
  render(){
    return (
      <div className="gene-id-filter">
        <label htmlFor="gene_id_filter">Gene IDs</label>
        <textarea 
          className="form-control" 
          id="gene_id_filter" 
          type="text" 
          rows="4" 
          onChange={this.parseGeneIds} />
      </div>
    )
  }
}

export default GeneIdSelect