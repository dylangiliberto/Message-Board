import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/commentViewer.css';
import Comment from './Comment';
import ThreadHeader from './ThreadHeader';
import ThreadManager from './ThreadManager';
import {
  useParams,
  Navigate
} from "react-router-dom";

export default function Thread({ sessionData }) {
    let [comments, setComments] = useState(0);
    let [threadData, setThreadData] = useState(0);   
    let [forbidden, setForbidden] = useState(false);
    let [pfp, setPfp] = useState("");
    const { threadID } = useParams();

    useEffect(() => {
      async function f() {
        let cUrl = "http://dylangiliberto.com:3001/comments";
        let f = await fetch(cUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username: sessionData?.user?.username, 
            SID: sessionData?.token, 
            id: threadID,
            requestDeleted: sessionData?.user?.administrator})
        });
        console.log('TEST' + sessionData?.user?.username);
        console.log('TEST' + sessionData?.user?.administrator);
        if(f.status === 403) {
          setForbidden(true);
        }
        else {
          let res = await f.json();
          setComments(res.comments);
          setThreadData(res.thread[0]);
          setPfp(res.pfp);
        }
      }
      f();
    }, []);

    let head = (
      <div>
        <ThreadHeader sessionData={sessionData} threadData={threadData} setComments={setComments} setForbidden={setForbidden} />
        <ThreadManager sessionData={sessionData} threadData={threadData} setForbidden={setForbidden} setThreadData={setThreadData} />
      </div>
    );

    let commentsTable;
    if(comments[0]) {
      commentsTable = (
        <div className="Page">
          
              {comments[0].username ? 
                comments.map(row => {
                  if(row.deleted === 0 || sessionData?.user?.administrator === 1){
                    return(
                        <Comment key={row.ID} comment={row} sessionData={sessionData} threadID={threadID} setComments={setComments}/>
                    );
                  }
                }) : "No Comments Yet..."}
           
        </div>
      );
    }

    let noComments = (
      <div className='Page'>
        <h1>
          It's empty :(
        </h1>
      </div>
    );
 
    if(threadData && forbidden === false){
      return(
        <div>
          {head}
          {comments[0] ? commentsTable : noComments}
        </div>
      );
    }
    else if (forbidden === true) {
      return (<Navigate replace to="/forbidden" />);
    }
    else
      return <h1>Loading...</h1>;
}