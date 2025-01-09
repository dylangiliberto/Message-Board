import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function UserRolesForm({ sessionData, setSessionData, username }) {
    const [roles, setRoles] = useState();

    useEffect(() => {
        const url = "https://api.board.dylang140.com/getUserRoles";
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
                //console.log(json.user);
                console.log(json.roles[0].roleDisplayName);
                setRoles(json.roles);
            } catch (error) {
                console.log("error", error);
            }
        };

        fetchData();
    }, [sessionData, username]);

    /*
    const updateRoles = async e => {
        e.preventDefault();
        let response;
        if(roles) {
            try {
                let sendData = {username: sessionData?.user?.username,
                                SID: sessionData?.token,
                                newName: newDisplayName,
                                newHexCode: newHexCode};
                const url = "https://api.board.dylang140.com/updateDisplayName";
                response = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(sendData)
                });
            }
            catch {
                setSuccess(false);
            }
            if(response?.status !== 200) {
                setSuccess(false);
            }
            else {
                let data = await response.json();
                console.log(data);
                setData(data)
                setSessionData({user: data, token: sessionData?.token});
                setSuccess(true);
            }
        }
        else {
            setSuccess(false);
        }
    };
    */

    return (
        <div>
            <h3>Users Roles</h3>
            {roles ? roles[0].roleDisplayName : ""}
        </div>
    );

}



