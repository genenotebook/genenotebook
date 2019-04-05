import { Meteor } from 'meteor/meteor';

import React from 'react';
import {
  BrowserRouter as Router, Route, Switch, Redirect,
} from 'react-router-dom';

import LandingPage from '/imports/ui/landingpage/LandingPage.jsx';
import GeneTable from '/imports/ui/genetable/GeneTable.jsx';
import SubmitBlast from '/imports/ui/blast/SubmitBlast.jsx';
import BlastResult from '/imports/ui/blast/BlastResult.jsx';
import SingleGenePage from '/imports/ui/singleGenePage/SingleGenePage.jsx';
import UserProfile from '/imports/ui/user-profile/UserProfile.jsx';
import Admin from '/imports/ui/admin/Admin.jsx';
import Download from '/imports/ui/download/Download.jsx';

import Login from './Login.jsx';
import Register from './Register.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

const App = () => {
  const urlParts = Meteor.absoluteUrl().split('/');
  const basename = urlParts.slice(3).join('/');
  return (
    <Router basename={basename}>
      <React.Fragment>
        <Header />
        <main role="main" className="h-100">
          <Switch>
            <Route exact path="/" component={LandingPage} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/genes" component={GeneTable} />
            <Route path="/gene/:geneId" component={SingleGenePage} />
            <Route exact path="/blast" component={SubmitBlast} />
            <Route path="/blast/:jobId" component={BlastResult} />
            <Route exact path="/profile" component={UserProfile} />
            <Route exact path="/admin" render={() => <Redirect to="/admin/users" />} />
            <Route path="/admin/user/:userId" component={UserProfile} />
            <Route path="/admin/:page" component={Admin} />
            <Route path="/download/:downloadId" component={Download} />
          </Switch>
        </main>
        <Footer />
      </React.Fragment>
    </Router>
  );
};

export default App;
