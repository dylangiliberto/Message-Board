import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/likeButton.css';
import {
    Navigate,
    useLocation,
    useNavigate
  } from "react-router-dom";

export default function LikeButton({ initial, initCount, comment, threadID, sessionData }) {
    let [liked, setLiked] = useState(initial);
    let [count, setCount] = useState(initCount);
    let [forbidden, setForbidden] = useState(false);
    let [notLoggedIn, setNotLoggedIn] = useState(false);
    let [unauth, setUnauth] = useState();

    const likeComment = async e => {
        e.preventDefault();
        if(sessionData?.token) {
            //console.log("Comment: " + comment + " Thread: " + threadID + " User: " + username + " Token: " + token);
            let url = "https://api.board.dylang140.com/likeComment";
            let c = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({comment: comment, thread: threadID, username: sessionData.user.username, SID: sessionData.token })
            });
            if(c.status == 403) {
                setForbidden(true);
            }
            if(c.status == 401) {
                setUnauth(true);
            }
            let json = await c.json();
            //console.log(json);
            setLiked(json.liked);
            setCount(json.count.likes);
        }
        else {
            setNotLoggedIn(true);
        }
    }

    const location = useLocation().pathname;

    const navigate = useNavigate();
    

    if(!forbidden && !unauth && notLoggedIn == false) {
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
    else if(notLoggedIn) {
        navigate('/login', { state: { redirectTo: location } });
        //return (<Navigate replace to={"/login"} redirectTo={location} />);
    }
    else if(forbidden) {
        return (<Navigate replace to="/forbidden" />);
    }
    else if(unauth) {
        
        return <Navigate replace to={"/logout"} />;
    }
}