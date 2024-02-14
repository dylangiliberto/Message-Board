import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import { NavLink } from "react-router-dom";

export default function AdminCorner({ sessionData }) {
    let className = "NavLink NavRight";
    let activeClassName = "NavLink NavActive NavRight";
    if(sessionData?.user?.administrator){
        return (
            <NavLink to="/admin" className={({ isActive }) =>
            isActive ? activeClassName : className}
            >
               Admin
            </NavLink>
        );
    }
    
}

