import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useToken from '../Account/Components/useSession';
import Login from '../Account/Login';
import '../../App.css';
import '../../styles/newThread.css';
import {
  Navigate,
} from "react-router-dom";

export default function NewThread({ sessionData, setSessionData }) {
    let [title, setTitle] = useState();
    let [desc, setDesc] = useState();
    let [success, setSuccess] = useState();
    let [forbidden, setForbidden] = useState();
    let [unauth, setUnauth] = useState();

    let err = "No Error";

    const handleSubmit = async e => {
        e.preventDefault();
        if(title && desc) {
            console.log("Creating Thread" + title + desc);
            let url = "https://api.board.dylang140.com/newThread";
            let c = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({title: title, desc: desc, username: sessionData?.user?.username, SID: sessionData?.token})
            });
            if(c.ok) {
                setSuccess(true);
            }
            else if(c.status === 403) { //Forbidden
                setForbidden(true);
            }
            else if(c.status === 401) { //Unauthorized 
                setUnauth(true);
            }
        }
    }

    if(forbidden) {
        return <Navigate replace to="/forbidden" />
    }
    else if(unauth) {
        return <Navigate replace to="/logout" />
    }
    else if(success) {
        return <Navigate replace to="/" />  
    }
    else if(sessionData?.token){
        return(
            <div className="Page newThread">
            <h1>New Space</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    <p>Space Title</p>
                    <input type="text" className="TextField" maxlength="35" onChange={e => setTitle(e.target.value)} value={title} />
                    <br/>{title ? title.length + "/35" : ""}
                </label>
                <label>
                    <p>Description</p>
                    <input type="text" className="TextField" maxlength="100" onChange={e => setDesc(e.target.value)} value={desc}/>
                    <br/>{desc ? desc.length + "/100" : ""}
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
        return <Login sessionData={sessionData} setSessionData={setSessionData} />;
    }
}

Login.propTypes = {
    setSessionData: PropTypes.func.isRequired,
};