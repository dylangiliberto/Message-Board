import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useToken from './useSession';
import '../../App.css';
import {
  Navigate
} from "react-router-dom";

export default function Logout({sessionData, setSessionData, forbidden}) {
    if(sessionData.token) {
        fetch("http://dylangiliberto.com:3001/logout", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: sessionData.token})
        });
    }
    setSessionData("");

    return (
        <div className="Page">
            <br/><br/>
            <h1 align="center">You have been logged out!</h1>
            <h2 style={{color: 'red', 'text-align': 'center'}}>
                {forbidden == true ? "You may have been logged out by an administrator, or there may have been a server error" : ""}
            </h2>
        </div>
    );
}