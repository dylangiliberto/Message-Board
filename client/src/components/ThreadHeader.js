import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/commentViewer.css';
import Comment from './Comment';
import {
  useParams,
  Navigate,
  Link
} from "react-router-dom";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function ThreadHeader({ sessionData, threadData, setComments, setForbidden}) {
    let [comment, setComment] = useState();
    let [file, setFile] = useState();
    let [tooLarge, setTooLarge] = useState(false);

    let date = new Date(threadData['date_created']);
    let dateFormatted = months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

    const postComment = async e => {
        e.preventDefault();
        if(comment || file) {
          console.log("Posting Comment");
          const formData = new FormData();
          if(file) {
            if(file.size < 1000000) {
              formData.append('image', file);
            }
            else {
              console.log("File too large: " + file.size);
            }
          }
          if(!file || (file && file.size < 1000000)) {
            formData.append('comment', comment || "");
            formData.append('username', sessionData.user.username);
            formData.append('thread', threadData.ID);
            formData.append('SID', sessionData.token);
            formData.append('requestDeleted', sessionData?.user?.administrator);
            let url = "https://api.board.dylang140.com/postComment";
            let c = await fetch(url, {
              method: 'POST',
              body: formData
            });
            console.log(file);
            if(c.status === 403) {
              setForbidden(true);
            }
            else if(c.ok) {
              setComment("");
              let res = await c.json();
              //console.log(res);
              setComments(res);
            }
            else {
              setComment("err");
            }
            setTooLarge(false);
          }
          else {
            setTooLarge(true);
          }
        }
    }

    let form;
    if(sessionData?.token){
      form = 
      <form onSubmit={postComment}  encType="multipart/form-data">
          <p>Post a Comment {comment ?  " - " + comment.length + "/1000" : ""}</p>
          <textarea className="commentBox TextField" maxLength="1000" type="text" onChange={e => setComment(e.target.value)} value={comment} />
          <br/>
          <label>1 MB Max </label>
          <input type="file" name="file" onChange={e => setFile(e.target.files[0])}/>
          <br/>
          <br/>
          <input className="Button" type="submit" value="Post!"/>
          <br/>
          <br/>
      </form>;
    }
    else
      form = <h3><i>Please log in to post a comment</i></h3>;

    let lockedMsg = "";
    if(threadData.locked === 1) {
      if(sessionData?.user?.administrator === 1)
        lockedMsg = <label style={{"color": "red"}}><i>This thread is locked, but you are an administrator</i></label>;
      else if(sessionData?.user?.username === threadData.username)
        lockedMsg = <label style={{"color": "red"}}><i>This thread is locked, but you created this thread</i></label>;
      else 
        lockedMsg = <label style={{"color": "red"}}><i>This thread is locked</i></label>;
    }

    let deletedMsg = (
      <label style={{"color": "red"}}><i>This Thread Is Deleted</i></label>
    );

    return (
        <div className="Page">
            <h1>{threadData ? threadData['title'] : "loading"}</h1>
            <h2>{threadData ? threadData['description'] : "loading"}</h2>
            <h3><i>Created on {dateFormatted} by <Link className="Link" to={"/user/" + threadData['username']}>{threadData['displayName']}</Link></i></h3>
            {threadData.deleted === 1 ? <div>{deletedMsg}<br/></div> : ""}
            {lockedMsg}<br/>
            {threadData.archived ? <label style={{"color": "red"}}><i>This thread is Archived</i></label> : ""}
            <br/>
            {(!threadData.archived && (sessionData?.user?.administrator === 1 || sessionData?.user?.username === threadData.username || threadData.locked === 0)) ? form : ""}
            {(comment === "err") ? <p style={{color: 'red'}}>An error occured while posting comment...</p> : ""}
            {(tooLarge === true) ? <p style={{color: 'red'}}>File must not exceed 1 MB</p> : ""}
        </div>
    );
}