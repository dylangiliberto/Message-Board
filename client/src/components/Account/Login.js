import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useSession from './useSession';
import '../../App.css';
import {
  Navigate,
} from "react-router-dom";

async function loginUser(credentials, setUser) {
  let token = fetch('https://api.board.dylangiliberto.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  }).then(response => {
    if(response.ok)
      return response.json();
    return "Failed";
  });
  return token;
}

export default function Login({ sessionData, setSessionData }) {
  const [username, setUserName] = useState();
  const [password, setPassword] = useState();
  let [success, setSuccess] = useState(true);

  const handleSubmit = async e => {
    e.preventDefault();
    console.log("Sending " + username + " " + password);
    const res = await loginUser({
      username,
      password
    }, setSessionData);
    if(res.token){
      console.log("User: " +  JSON.stringify(res));
      console.log("Token: " + res.token);
      console.log("Success: " + success);
      setSessionData(res);
    }
    else {
      setPassword("");
      setSuccess(false);
    }
  }
  if(!sessionData?.token){
    let err = <h3 style={{color: 'red'}}>Please verify username and password</h3>;
    return(
      <div className="login-wrapper Page">
        <h1>Please Log In</h1>
        {success ? "" : err}
        <form onSubmit={handleSubmit}>
          <label>
            <p>Username</p>
            <input type="text" className="TextField" onChange={e => setUserName(e.target.value)} />
          </label>
          <label>
            <p>Password</p>
            <input type="password" className="TextField" onChange={e => setPassword(e.target.value)} value={password}/>
          </label>
          <div>
            <br/>
            <button className="Button" type="submit">Submit</button>
          </div>
        </form>
      </div>
    )
  }
  else {
    return <Navigate replace to="/" />;
  }
}

Login.propTypes = {
  sessionData: PropTypes.func.isRequired,
  setSessionData: PropTypes.func.isRequired
};