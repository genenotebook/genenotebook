import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import AdminUsers from './users/AdminUsers.jsx';
import AdminGenomes from './genomes/AdminGenomes.jsx';
import AdminAttributes from './attributes/AdminAttributes.jsx';
import AdminTranscriptomes from './transcriptomes/AdminTranscriptomes.jsx';
import AdminJobqueue from './jobqueue/AdminJobqueue.jsx';

import './admin.scss';

const ADMIN_PAGES = {
  users: <AdminUsers />,
  genomes: <AdminGenomes />,
  attributes: <AdminAttributes />,
  transcriptomes: <AdminTranscriptomes />,
  jobqueue: <AdminJobqueue />,
};

function urlToName(url) {
  return url
    .match(/(\w)(\w*)/g)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

const Nav = ({ pages, currentPage, setCurrentPage }) => (
  <header className="has-background-light">
    <h4 className="title is-size-4 has-text-weight-light">
      Admin panel
    </h4>
    <div className="tabs is-boxed">
      <ul>
        {
        pages.map((page) => {
          const pageName = urlToName(page);
          const isActive = page === currentPage
            ? 'is-active'
            : '';
          return (
            <li key={page} role="presentation" className={isActive}>
              <NavLink
                to={`/admin/${page}`}
                className="nav-link"
                activeClassName="is-active"
                onClick={() => {
                  setCurrentPage(page);
                }}
              >
                { pageName }
              </NavLink>
            </li>
          );
        })
      }
      </ul>
    </div>
  </header>
);

export default function Admin({ match }) {
  const { params: { page } } = match;
  const [currentPage, setCurrentPage] = useState(page);
  const pages = Object.keys(ADMIN_PAGES);
  return (
    <div className="container">
      <div className="card admin-menu">
        <Nav
          pages={pages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        { ADMIN_PAGES[currentPage] }
      </div>
    </div>
  );
}
