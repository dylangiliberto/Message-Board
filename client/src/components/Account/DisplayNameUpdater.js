import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function DisplayNameUpdater({ sessionData, setSessionData, setData }) {
    let [newDisplayName, setNewDisplayName] = useState();
    let [newHexCode, setNewHexCode] = useState();
    let [success, setSuccess] = useState();

    const updateDisplayName = async e => {
        e.preventDefault();
        let response;
        if(newDisplayName) {
            try {
                let sendData = {username: sessionData?.user?.username,
                                SID: sessionData?.token,
                                newName: newDisplayName,
                                newHexCode: newHexCode};
                const url = "http://dylangiliberto.com:3001/updateDisplayName";
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
    let successMsg;
    if(success === true) {
        successMsg = <label style={{"color": "green"}}>Updated!</label>;
    }
    else if(success === false) {
        successMsg = <label style={{"color": "red"}}>Could not update name!</label>;
    }
    else {
        successMsg = "";
    }

    return (
        <div>
            <form onSubmit={updateDisplayName}>
                <input type="text" className="TextField" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Enter a new Display Name" />
                <span> </span>
                <input type="text" className="TextField" maxLength="6" value={newHexCode} onChange={e => setNewHexCode(e.target.value)} placeholder="Hex Code (6 Digit, no #)" />
                <span> </span><input type="submit" className="Button" value="Update"/> {successMsg}
            </form>
        </div>
    );

}



