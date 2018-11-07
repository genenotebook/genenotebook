import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';

import LandingPage from '/imports/ui/landingpage/LandingPage.jsx';
import GeneTable from '/imports/ui/genetable/GeneTable.jsx';
import SubmitBlast from '/imports/ui/blast/SubmitBlast.jsx';
import SingleGenePage from '/imports/ui/singleGenePage/SingleGenePage.jsx';

import Header from './Header.jsx';

//import '/imports/ui/global_stylesheets/global.scss';
//import '/imports/ui/global_stylesheets/fontello/css/fontello.css';

const App = () => {
  return <Router>
    <React.Fragment>
      <Header />
      <Switch>
        <Route exact path='/' component={LandingPage} />
        <Route exact path='/genes' component={GeneTable} />
        <Route exact path='/blast' component={SubmitBlast} />
        <Route path='/gene/:geneId' component={SingleGenePage} />
      </Switch>
    </React.Fragment>
  </Router>
}

export default App;