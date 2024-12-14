import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import { NavLink } from "react-router-dom";
import AccountCorner from './AccountCorner';
import LogCorner from './LogCorner';
import AdminCorner from './AdminCorner';

export default function NavBarMain({ sessionData, activeTab }) {
  let className = "NavLink";
  let activeClassName = "NavLink NavActive";
  return (
    <div className="Nav">
      <ul className="Nav">
          <NavLink to="/" className={({ isActive }) =>
              isActive ? activeClassName : className
            }>
              Home
          </NavLink>
          
          <NavLink to="/about" className={({ isActive }) =>
              isActive ? activeClassName : className
            }>
            About
          </NavLink>
          <AccountCorner sessionData={sessionData} />  
          <LogCorner sessionData={sessionData} />
          <AdminCorner sessionData={sessionData} />
      </ul>
    </div>
  );
}
/*
<NavLink to="/archived" className={({ isActive }) =>
    isActive ? activeClassName : className
  }>
  Archived Threads
</NavLink>
*/

