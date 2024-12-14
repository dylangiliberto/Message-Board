import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';
import {
  Navigate,
  useLocation
} from "react-router-dom";

async function loginUser(credentials, setUser) {
  let token = fetch('https://api.board.dylang140.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  }).then(response => {
    if(response.ok)
      return response.json();
    return response.statusText;
  });
  return token;
}

export default function Login({ sessionData, setSessionData, redirectTo}) {
  const [username, setUserName] = useState();
  const [password, setPassword] = useState();
  let [success, setSuccess] = useState(true);
  let [errorMessage, setErrorMessage] = useState();
  const {state} = useLocation();

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await loginUser({
      username,
      password
    }, setSessionData);
    if(res?.token){
      res.user.viewDeletedComments = res.user.administrator;
      setSessionData(res);
    }
    else {
      setPassword("");
      setSuccess(false);
      setErrorMessage(res);
    }
  }
  if(!sessionData?.token){
   
    let err = <h3 style={{color: 'red'}}>{errorMessage}</h3>;
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
    if(state?.redirectTo){
      return <Navigate replace to={state.redirectTo} />;
    }    
    return <Navigate replace to="/" />;
  }
}

Login.propTypes = {
  sessionData: PropTypes.func.isRequired,
  setSessionData: PropTypes.func.isRequired
};