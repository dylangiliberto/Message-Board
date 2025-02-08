import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useToken from '../Account/Components/useSession';
import '../../App.css';
import {
  Navigate
} from "react-router-dom";

export default function Forbidden({sessionData, setSessionData, reason}) {
    return (
        <div className="Page">
            <br/><br/>
            <h1 align="center">You do not have access to this function</h1>
            <h2 align="center"><a href='/'>Return Home</a></h2>
            <h2 style={{color: 'red', 'text-align': 'center'}}>
                {reason}
            </h2>
        </div>
    );
}