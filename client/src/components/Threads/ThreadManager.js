import React, { useEffect, useState } from 'react';
import '../../App.css';
import '../../styles/commentViewer.css';
import {
  useParams,
  Navigate
} from "react-router-dom";


export default function ThreadManager({ threadData, sessionData, setForbidden, setThreadData}) {
    let [locked, setLocked] = useState(threadData.locked);
    let [deleted, setDeleted] = useState(threadData.deleted);
    let [archived, setArchived] = useState(threadData.archived);

    let lockedForm = "";
    let msg = "";

    if (sessionData?.user?.administrator === 1)
        msg = "You are an administrator and can manage this thread";
    else if(sessionData?.user?.username === threadData.username) 
        msg = "You created this thread and can manage it";

    const updateThread = async e => {
        e.preventDefault();
        console.log("Updating Thread");
        let url = "https://api.board.dylang140.com/updateThread";
        let c = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {username: sessionData.user.username, SID: sessionData.token, thread: threadData.ID, setLocked: locked, setDeleted: deleted, setArchived: archived})
        });
        if(c.status === 403){
            setForbidden(true);
        }
        if(c.ok) {
            let res = await c.json();
            console.log("Updating new thread data....");
            console.log(res.threadData[0]);
            setThreadData(res.threadData[0]);
        }
    }

    if(sessionData?.user?.administrator === 1 || sessionData?.user?.username === threadData.username) {
        lockedForm = (
            <form onSubmit={updateThread}>
                <input type="checkbox" id="lock" name="lock" checked={locked ? "checked" : ""} onChange={e => setLocked(!locked)} />
                <label htmlFor="lock">Lock Thread</label><br/>
                <input type="checkbox" id="delete" name="delete" checked={deleted ? "checked" : ""}onChange={e => setDeleted(!deleted)}/>
                <label htmlFor="delete">Delete Thread</label><br/>
                <input type="checkbox" id="archive" name="archive" checked={archived ? "checked" : ""}onChange={e => setArchived(!archived)}/>
                <label htmlFor="archive">Archive Thread</label><br/>
                <br/>
                <input type="submit" value="Save Changes" />
            </form>
        );
    }
    return (
        <div className='Page'>
            <h3><i>{msg}</i></h3>
            {lockedForm}
        </div>
    );
}