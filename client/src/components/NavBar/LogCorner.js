import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import { NavLink } from "react-router-dom";

export default function LogCorner({ sessionData }) {
    let className = "NavLink NavRight";
    let activeClassName = "NavLink NavActive NavRight";
    if(sessionData){
        return (
            <NavLink to="/logout" className={({ isActive }) =>
            isActive ? activeClassName : className}
            >
               Log Out
            </NavLink>
        );
    }
    return (
        <NavLink to="/login" className={({ isActive }) =>
        isActive ? activeClassName : className}
        >
            Log In
        </NavLink>
    );
}

