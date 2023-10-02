import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useToken from './Account/useSession';
import '../App.css';
import '../styles/signUp.css';
import {
  Navigate,
} from "react-router-dom";

export default function SignUp({}) {
    let [username, setUsername] = useState();
    let [password, setPassword] = useState();
    let [email, setEmail] = useState();
    let [confirm, setConfirm] = useState();
    let [success, setSuccess] = useState();
    let [taken, setTaken] = useState(false);
    let [passwordIssue, setPasswordIssue] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        if(username) {
            let av = await fetch('https://api.board.dylangiliberto.com/usernameAvaliable', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({username})
            });
            let res = await av.json();
            console.log("Avaliable?: " + res);
            if(res !== true) {
                setTaken(true);
            }
            else {
                setTaken(false);
            }
            if(password.length >= 8  && (password === confirm)) {
                setPasswordIssue(false);
                if(!taken && email && password === confirm){
                    console.log("registering Account");
                    let accountInfo = {username: username, password: password, email: email};
                    let res = await fetch('https://api.board.dylangiliberto.com/register', {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(accountInfo)
                    });
                    if(!res.ok) {
                        setUsername("");
                        setPassword("");
                        setConfirm("");
                        setEmail("");
                        setSuccess(false);
                    }
                    else {
                        setSuccess(true);
                    }
                }
            }
            else {
                setPasswordIssue(true);
            }
        }
    }
    if(success === true) {
        return(
            <div className="Page">
                <h1 style={{"text-align":"center"}}>Success!</h1>
                <h3 style={{"text-align":"center"}}>You may now log-in to your new account</h3>
            </div>
        );
    }
    return (
        <div className="signUp">
            <h1 className="signUp">Sign Up</h1>
            <form onSubmit={handleSubmit}>
                <p className="signUp">Username</p>
                <input className="TextField" type="text" value={username} onChange={e => setUsername(e.target.value)}/>
                <br/>
                <span style={{color: 'red'}}>{taken === true ? "Username Taken!" : ""}</span>
                
                <p className="signUp">Email</p>
                <input className="TextField" type="text" value={email} onChange={e => setEmail(e.target.value)}/>
                <br/>
                <p className="signUp">Password</p>
                <input className="TextField" type="password" value={password} onChange={e => setPassword(e.target.value)}/>
                <br/>
                <p className="signUp">Confirm Password</p>
                <input className="TextField" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}/>
                <br/>
                <input type="submit" className="Button"/>
            </form>
            <p style={{color: 'red'}}>{success === false ? "Could not register account! Please verify that passwords match!" : ""}</p>
            
            <p style={{color: 'red'}}>{passwordIssue === true ? "Please Verify that password is more than 8 characters, passwords match, and that no fields are blank" : ""}</p>
        </div>
    );
}