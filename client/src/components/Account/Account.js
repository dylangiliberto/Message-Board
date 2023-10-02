import React, { useState, useEffect } from 'react';
import '../../App.css';
import DisplayNameUpdater from './DisplayNameUpdater';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Account({ sessionData, setSessionData }) {
    let [data, setData] = useState();
    let [bio, setBio] = useState();
    let [bioError, setBioError] = useState();
    let [pfp, setPfp] = useState();
    let [pfpSizeError, setPfpSizeError] = useState(false);
    let [pfpError, setPfpError] = useState(false);

    useEffect(() => {
        const url = "https://api.board.dylangiliberto.com/user";
        let sendData = {username: sessionData?.user?.username,
            SID: sessionData?.token};

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
                setData(json.user);
            } catch (error) {
                console.log("error", error);
            }
        };

        fetchData();
    }, []);

    const updatePfp = async e => {
        e.preventDefault();
        let response;
        if(pfp && pfp.size < 1000000) {
            setPfpSizeError(false);
            setPfpError(false);
            try {
                const formData = new FormData();
                const url = "https://api.board.dylangiliberto.com/updatePfp";
                formData.append('username', sessionData?.user?.username);
                formData.append('SID', sessionData?.token);
                formData.append('image', pfp);
                response = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
            }
            catch {
                setPfpError(true);
            }
            if(response?.status !== 200) {
                setPfpError(true);
            }
            else {
                setPfpError(false);
            }
        }
        else {
            setPfpSizeError(true);
        }
    };

    const updateBio = async e => {
        e.preventDefault();
        const url = "https://api.board.dylangiliberto.com/updateBio";
        let sendData = {username: sessionData?.user?.username,
                        SID: sessionData?.token,
                        bio: bio};
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendData)
            });
        }
        catch {
            setBioError(true);
        }
        if(response?.status !== 200) {
            setBioError(true);
        }
        else {
            setBioError(false);
        }
    };

    if(data){
        let dateCreated = new Date(data.date_created|| "");
        let dateLogged = new Date(data.date_last_logged_in|| "");
        if(dateCreated !== "") {
            dateCreated.setHours(dateCreated.getHours() - 10);
            dateCreated = months[dateCreated.getMonth()] + " " + dateCreated.getDate() + ", " + dateCreated.getFullYear();
        }
        if(dateLogged !== "") {
            //dateLogged.setHours(dateLogged.getHours() - 10);
            dateLogged = months[dateLogged.getMonth()] + " " + dateLogged.getDate() + ", " + dateLogged.getFullYear() + " at "
                + (dateLogged.getHours() > 12 ? dateLogged.getHours() - 12 : dateLogged.getHours()) + ":" + dateLogged.getMinutes() 
                + (dateLogged.getHours() > 12 ? " PM" : " AM");
        }
        let bioForm = (
            <form onSubmit={updateBio}>
                <textarea className="textArea bioForm" onChange={e => setBio(e.target.value)} value={data.user_bio ? data.user_bio : ""}/>
                <br/>
                <input type="submit" value="Update" className="Button" />
                {bioError === true ? <label style={{color: "red"}}> Could not update bio!</label> : ""}
                {bioError === false ? <label style={{color: "green"}}> Saved!</label> : ""}
            </form>
        );
        return(
            <div className="Page">
                <h2>Account Information</h2>
                <table className="DataList">
                    <tbody>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Username:</p></i></td>
                            <td><p className="DataListItem">{data.username || ""}</p></td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Display Name:</p></i></td>
                            <td>
                                <p className="DataListItem" style={{'color': '#' + data.displayNameHex}}>
                                    {data.displayName || ""} 
                                </p>
                                <DisplayNameUpdater sessionData={sessionData} setSessionData={setSessionData} setData={setData} />               
                            </td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Profile Picture:</p></i></td>
                            <td>
                                <table><tbody>  
                                    <tr>
                                        <td>
                                            {
                                                data?.imageURL && data?.imageURL !== "" ? 
                                                <img className="pfp" src={"https://api.board.dylangiliberto.com/" + data?.imageURL} /> : 
                                                <img className="pfp" src="../pfp_default.png" />
                                            }
                                        </td>
                                        <td>
                                            <form onSubmit={updatePfp}>
                                                <input type="file" name="file" onChange={e => setPfp(e.target.files[0])}/>
                                                <br/><br/>
                                                <input type="submit" className="Button" /> 
                                                <label style={{"color":"red"}}>{pfpSizeError ? " Image must be less than 1MB!" : ""}</label>
                                                <label style={{"color":"red"}}>{pfpError ? " Could not update profile picture!" : ""}</label>
                                            </form>
                                        </td>
                                    </tr>
                                    </tbody></table>                       
                            </td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">E-Mail Address:</p></i></td>
                            <td><p className="DataListItem">{data.email || ""}</p></td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Bio:</p></i></td>
                            <td>
                                {bioForm}
                            </td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Last Seen:</p></i></td>
                            <td><p className="DataListItem">{dateLogged || ""}</p></td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Date Joined:</p></i></td>
                            <td><p className="DataListItem">{dateCreated || ""}</p></td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Administrator:</p></i></td>
                            <td><p className="DataListItem">{data.administrator ? "Yes" : "No"}</p></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
    return <h2>Please log in to see account information</h2>;
}

