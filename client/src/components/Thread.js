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
    let [noThread, setNoThread] = useState(false);
    let [loadedAndNotForbidden, setLoadedAndNotForbidden] = useState(false);
    let [pfp, setPfp] = useState("");
    const { threadID } = useParams();

    useEffect(() => {
      async function f() {
        let cUrl = "https://api.board.dylang140.com/comments";
        let f = await fetch(cUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username: sessionData?.user?.username, 
            SID: sessionData?.token, 
            id: threadID,
            requestDeleted: (sessionData?.user?.administrator && sessionData?.user?.viewDeletedComments == true)})
        });
        //console.log('TEST' + sessionData?.user?.username);
        //console.log('TEST' + sessionData?.user?.administrator);
        if(f.status === 403) {
          setForbidden(true);
          setLoadedAndNotForbidden(false);
        }
        else if(f.status === 404) {
          setNoThread(true);
        }
        else {
          let res = await f.json();
          setComments(res.comments);
          setThreadData(res.thread[0]);
          setPfp(res.pfp);
          setLoadedAndNotForbidden(true);
        }
      }
      f();
    }, []);

    let commentsTable;
    let head = (
      <div>
        <ThreadHeader sessionData={sessionData} threadData={threadData} setComments={setComments} setForbidden={setForbidden} />
        <ThreadManager sessionData={sessionData} threadData={threadData} setForbidden={setForbidden} setThreadData={setThreadData} />
      </div>
   );
    if(comments[0]?.username) {
      commentsTable = (
        <div className="Page">
          
              {comments[0].username ? 
                comments.map(row => {
                  if(row.deleted === 0 || (sessionData?.user?.administrator === 1 && sessionData?.user?.viewDeletedComments === true)){
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
        <div className="commentWrapper">
          <div className="commentBodyWrapper">
            <h1>
              It's empty :(
            </h1>
            But you could be the first to post!
          </div>
        </div>
      </div>
    );
 
    if(loadedAndNotForbidden === true){
      return(
        <div>
          {head}
          {comments[0]?.username ? commentsTable : noComments}
        </div>
      );
    }
    else if (forbidden === true) {
      return (<Navigate replace to="/forbidden" />);
    }
    else if(noThread === true) {
      return (<h1>&nbsp;This thread does not exist</h1>);
    }
    else
      return <h1>Loading...</h1>;
}