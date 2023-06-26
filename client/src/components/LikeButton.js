import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/likeButton.css';
import {
    Navigate
  } from "react-router-dom";

export default function LikeButton({ initial, initCount, comment, threadID, sessionData }) {
    let [liked, setLiked] = useState(initial);
    let [count, setCount] = useState(initCount);
    let [forbidden, setForbidden] = useState(false);

    const likeComment = async e => {
        e.preventDefault();
        if(sessionData?.token) {
            console.log("Liking Comment");
            //console.log("Comment: " + comment + " Thread: " + threadID + " User: " + username + " Token: " + token);
            let url = "http://dylangiliberto.com:3001/likeComment";
            let c = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({comment: comment, thread: threadID, username: sessionData.user.username, SID: sessionData.token })
            });
            if(c.status == 403) {
                console.log("Forbidden!");
                setForbidden(true);
            }
            let json = await c.json();
            //console.log(json);
            setLiked(json.liked);
            setCount(json.count.likes);
        }
        else {
            console.log("Not Logged In");
        }
    }

    if(!forbidden) {
        return (
            <table>
                <tbody>
                    <tr>
                        <td>
                            <form onSubmit={likeComment}>
                                <input className="likebutton" type="image" src={liked ? "../liked.png" : "../not_liked.png"}/>
                            </form>
                        </td>
                        <td>{count}</td>
                    </tr>
                </tbody>
            </table>
        );
    }
    else {
        return (<Navigate replace to="/forbidden" />);
    }
}