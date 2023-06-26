import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import { NavLink } from "react-router-dom";

export default function AccountCorner({ sessionData }) {
    let className = "NavLink NavRight";
    let activeClassName = "NavLink NavActive NavRight";
    if(sessionData){
        return (
            <NavLink to="/account" className={({ isActive }) =>
            isActive ? activeClassName : className}
            >
                Welcome, {sessionData.user.displayName}!
            </NavLink>           
        );
    }
    return (
        <NavLink to="/signup" className={({ isActive }) =>
        isActive ? activeClassName : className}>
            Sign Up
        </NavLink>
    );
}

