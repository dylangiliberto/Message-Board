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
    const [userRoles, setUserRoles] = useState();
    let [forbidden, setForbidden] = useState();

    useEffect(() => {
        let url = "https://api.board.dylang140.com/userAdmin";
        let sendData = {username: sessionData?.user?.username,
            SID: sessionData?.token, targetUsername: username};
        let fetchData = async () => {
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
        fetchRoles();
        
    }, [sessionData, username]);

    const fetchRoles = async e => {
        let url = "https://api.board.dylang140.com/getUserRolesTruthTable";
        let sendData = {username: sessionData?.user?.username,
            SID: sessionData?.token, targetUsername: username};
        let fetchData = async () => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendData)
                    })
                const json = await response.json();
                console.log(json.roles)
                setUserRoles(json.roles);
            } catch (error) {
                console.log("error", error);
            }
        };
        fetchData();
    };

    function updateRoles(roleID, value) {
        let url = "https://api.board.dylang140.com/setUserRole";
        let sendData = {username: sessionData?.user?.username,
            SID: sessionData?.token, targetUsername: username, roleID: roleID, value: value};
        let sendRoles = async () => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendData)
                    })
                const json = await response.json();
                setUserRoles(json.roles);
            } catch (error) {
                console.log("error updating roles", error);
            }
        };
        sendRoles();
    }

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
    };

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
        else if (c.status === 403) {
            setForbidden(true);
        }
    }

    let rolesList = (
        <table>
            <tr>
                <td><b>Role ID</b></td>
                <td><b>Name</b></td>
                <td><b>Abreviation</b></td>
                <td><b>Has Role</b></td>
            </tr>
            {userRoles ? 
                userRoles.map((row, index) => {
                    return (
                        <tr key={row.roleID}>
                            <td>{row.roleID}</td>
                            <td>{row.roleDisplayName}</td>
                            <td>{row.roleAbreviation}</td>
                            <td>
                                <form> 
                                    <input 
                                        type="checkbox" 
                                        value={row.hasRole ? true : false} 
                                        defaultChecked={row.hasRole ? true : false} 
                                        onChange={e => {updateRoles(row.roleID, e.target.checked ? true : false)}}
                                    />
                                </form>
                            </td>
                        </tr>
                    );
                })
                :
                ""
            }
        </table>
    );

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

    if(forbidden != true && data?.locked != null && redirect == false) {
        return (
            <div>
                <h2>Admin Controls</h2>
                <h3>Functions</h3>
                {lockButton}
                {logMeIn}
                {passwordChange}
                <h3>Information</h3>
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
                <h3>Roles</h3>
                {rolesList}      
            </div>
        );
    }
    else if(redirect == true) {
        return <Navigate to='/' />;
    }
    else if(forbidden) {
        return (<Navigate replace to='/forbidden' />);
    }
    else {
        return <div></div>;
    }

}



