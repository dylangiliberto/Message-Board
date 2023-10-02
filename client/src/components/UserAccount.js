import React, { useState, useEffect } from 'react';
import {
    useParams,
  } from "react-router-dom";
import '../App.css';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


export default function UserAccount() {
    let [data, setData] = useState();
    let { username } = useParams();

    useEffect(() => {
        const url = "https://api.board.dylangiliberto.com/userPublic";
        let sendData = {username: username};

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
                console.log(json.user);
                setData(json.user);
            } catch (error) {
                console.log("error", error);
            }
        };

        fetchData();
    }, []);

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
        let pfp = (
            data?.imageURL && data?.imageURL !== "" ? 
            <img className="pfpBig" src={"https://api.board.dylangiliberto.com/" + data?.imageURL} /> : 
            <img className="pfpBig" src="../pfp_default.png" />
        );
        return (
            <div className='Page'>
                <table><tbody><tr>
                    <td>
                        {pfp}
                    </td>
                    <td>
                        <h1>&nbsp;
                            <span className="DataListItem" style={{"color": '#' + data.displayNameHex}}>
                                {data.displayName || ""}
                            </span>
                        </h1>
                    </td>
                </tr></tbody></table>
                <h2>Username</h2>
                {data?.username}
                <h2>About</h2>
                <p className='textBlock showBreaks'>{data?.user_bio}</p>
                <h2>
                    Joined
                </h2>
                {dateCreated}
                <h2>
                    Last Seen
                </h2>
                {dateLogged}
                <h2>Administrator</h2>
                {data.administrator ? "Yes" : "No"}

            </div>
        )
        return(
            <div className="Page">
                <h2>{username}</h2>
                <table className="DataList">
                    <tbdoby>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Username:</p></i></td>
                            <td><p className="DataListItem">{data.username || ""}</p></td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Display Name:</p></i></td>
                            <td><p className="DataListItem" style={{"color": '#' + data.displayNameHex}}>{data.displayName || ""}</p></td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Profile Picture:</p></i></td>
                            <td> 
                                {pfp}
                            </td>
                        </tr>
                        <tr className="DataList">
                            <td><i><p className="DataListItem">Bio:</p></i></td>
                            <td><p className="DataListItem showBreaks">{data.user_bio || ""}</p></td>
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
                    </tbdoby>
                </table>
            </div>
        );
    }
    return <h2>Please log in to see account information</h2>;
}

