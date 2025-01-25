import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import {
  useParams,
  Navigate
} from "react-router-dom";

async function resetPassword(username, password, resetcode) {
  let f = fetch('https://api.board.dylang140.com/resetpassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({username, password, resetcode})
  }).then(response => {
    if(response.ok)
      return response;
    return response.statusText;
  });
  return f;
}

export default function ResetPassword({ sessionData, setSessionData}) {
    let [password, setPassword] = useState();
    let [username, setUsername] = useState();
    let [confirmp, setConfirmp] = useState();
    let [errorSrv, setErrorSrv] = useState();
    let [errorFld, setErrorFld] = useState();
    let [successp, setSuccessp] = useState();
    const { resetcode } = useParams();
    
    
    const handleSubmit = async e => {
        e.preventDefault();
        if(username && password && (password === confirmp) && (password.length >= 8)){
            const res = await resetPassword(username, password, resetcode);
            if(res?.status == 200){
                setErrorFld(false);
                setErrorSrv(false);
                setSuccessp(true);
            }
            else {
                setSuccessp(false);
                setErrorFld(false);
                setErrorSrv(res);
            }
        }
        else {
            setErrorSrv(false);
            setErrorFld(true);
        }
    }
        
    let err = <h3 style={{color: 'red'}}>{errorSrv}</h3>;

    if(!successp) {
        return (
            <div className="login-wrapper Page">
                <h2>Password Reset</h2>
                <form onSubmit={handleSubmit}>
                <label>
                    <p>Username</p>
                    <input type="text" className="TextField" onChange={e => setUsername(e.target.value)} />
                </label>
                <label>
                    <p>New Password</p>
                    <input type="password" className="TextField" onChange={e => setPassword(e.target.value)} value={password}/>
                </label>
                <label>
                    <p>Confirm New Password</p>
                    <input type="password" className="TextField" onChange={e => setConfirmp(e.target.value)} value={confirmp}/>
                </label>
                <div>
                    <br/>
                    <button className="Button" type="submit">Submit</button>
                </div>
                </form>
                <br/>
                {errorSrv ? err : ""}
                {errorFld ? <h3 style={{color: 'red'}}>All fields must be complete, passwords must match, and password must be 8 characters or longer</h3> : ""}
            </div>
        );
    }
    else {
        return (
            <div className="login-wrapper Page">
                <h2>Your password has been changed, you may now login</h2>
            </div>
        );
    }
}
