import React from 'react';
import { cloneDeep } from 'lodash';

//import GeneListSidePanel from './GeneListSidePanel.jsx';
import GeneTableOptions from './GeneTableOptions.jsx';
import GeneTable from './GeneTable.jsx';
import DownloadDialogModal from './downloads/DownloadDialog.jsx';

export default class GeneTableCard extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    return (
      <div className="container-fluid px-0 mx-0">
        <GeneTableOptions >
          <GeneTable />
          <DownloadDialogModal />
        </GeneTableOptions>
      </div>
    )
  }
}
