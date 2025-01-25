import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import {
  Navigate,
  useLocation
} from "react-router-dom";

async function forgotpassword(username) {
  let f = fetch('https://api.board.dylang140.com/forgotpassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({username})
  }).then(response => {
    if(response.ok)
      return response;
    return response.statusText;
  });
  return f;
}

export default function ForgotPassword({ sessionData, setSessionData}) {
    let [username, setUsername] = useState();
    let [errorSrv, setErrorSrv] = useState();
    let [errorFld, setErrorFld] = useState();
    let [successp, setSuccessp] = useState();
    
    const handleSubmit = async e => {
        e.preventDefault();
        if(username){
            const res = await forgotpassword(username);
            if(res?.status == 200){
                setSuccessp(true);
            }
            else {
                setErrorSrv(res);
                setSuccessp(false);
            }
        }
        else {
            setErrorFld(true);
        }
    }
        
    let err = <h3 style={{color: 'red'}}>{errorSrv}</h3>;

    if(!successp) {
        return (
            <div className="login-wrapper Page">
                <br/>
                <h1>Password Reset Request</h1>
                <form onSubmit={handleSubmit}>
                <label>
                    <p>Username</p>
                    <input type="text" className="TextField" onChange={e => setUsername(e.target.value)} />
                </label>
                <div>
                    <br/>
                    <button className="Button" type="submit">Submit</button>
                </div>
                </form>
                <br/>
                {errorSrv ? <h3 style={{color: 'red'}}>{errorSrv}</h3> : ""}
                {errorFld ? <h3 style={{color: 'red'}}>Please fill out all fields</h3> : ""}
            </div>
        );
    }
    else {
        return (
            <div className="login-wrapper Page">
                <h2>If an account by that name exists, an email has been sent with instructions</h2>
            </div>
        );
    }
}
