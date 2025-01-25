import React, { useState, useEffect } from 'react';
import '../../App.css';
import {
    Navigate,
    useLocation
  } from "react-router-dom";

export default function UserAdminControls({ sessionData, setSessionData, username }) {
    const [data, setData] = useState();
    const [locked, setLocked] = useState();
    const [newPass, setNewPass] = useState();
    const [redirect, setRedirect] = useState(false);
    const [passSuccess, setPassSuccess] = useState();

    useEffect(() => {
        const url = "https://api.board.dylang140.com/userAdmin";
        let sendData = {username: sessionData?.user?.username,
            SID: sessionData?.token, targetUsername: username};

        const fetchData = async () => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendData)
                    })
                const json = await response.json();
                console.log(json.user)
                setData(json.user);
                setLocked(json.user.locked);
            } catch (error) {
                console.log("error", error);
            }
        };

        fetchData();
    }, [sessionData, username]);

    const handleLock = async e => {
        e.preventDefault();
        
        let url = (locked === 1 ? "https://api.board.dylang140.com/unlockAccount" : "https://api.board.dylang140.com/lockAccount");
        let c = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {username: sessionData.user.username, 
                    SID: sessionData.token, 
                    targetUsername: data.username})
        });
        setLocked(locked === 1 ? 0 : 1);
    }
    const handlePasswordChange = async e => {
        e.preventDefault();
        
        let url = "https://api.board.dylang140.com/setPassword";
        let c = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {username: sessionData.user.username, 
                    SID: sessionData.token, 
                    targetUsername: data.username,
                    password: newPass})
        });
        if(c.ok){
            setPassSuccess(true);
        }
    }
    const handleLogMeIn = async e => {
        e.preventDefault();
        
        let url = "https://api.board.dylang140.com/logAdminOtherUser";
        let c = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {username: sessionData.user.username, 
                    SID: sessionData.token, 
                    targetUsername: data.username
                })
        });
        if(c.ok) {
            let result = await c.json();
            console.log(result);
            setSessionData(result);
            setRedirect(true);
        }
    }


    let lockButton = (
        <form onSubmit={handleLock}>
            <input style={{backgroundColor: locked === 1 ? 'red' : ''}} type="submit" className = "Button" value={locked === 1 ? "Unlock Account" : "Lock Account"}/>
        </form>
    );
    let passwordChange = (
        <form onSubmit={handlePasswordChange}>
            New Password: <input className="TextField" type="text" value={newPass} onChange={e => setNewPass(e.target.value)}/>
            <input type="submit" className = "Button" value={"Save"}/>
            {passSuccess === true ? "Success!" : ""}
        </form>
    );
    let logMeIn = (
        <form onSubmit={handleLogMeIn}>
            <input type="submit" className = "Button" value={"Log In as User"}/>
        </form>
    );

    if(data?.locked != null && redirect == false) {
        return (
            <div>
                <h2>Admin Controls</h2>
                {lockButton}
                {logMeIn}
                {passwordChange}
                <table>
                    <tr>
                        <td>Locked: </td>
                        <td>{locked}</td>
                    </tr>
                    <tr>
                        <td>Email: </td>
                        <td>{data.email}</td>
                    </tr>
                    <tr>
                        <td>Change Pword: </td>
                        <td>{data.force_change_password}</td>
                    </tr>
                </table>       
            </div>
        );
    }
    else if(redirect == true) {
        return <Navigate to='/' />;
    }
    else {
        return <div></div>;
    }

}



