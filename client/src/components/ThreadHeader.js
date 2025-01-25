import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/commentViewer.css';
import Comment from './Comment';
import {
  useParams,
  Navigate,
  Link
} from "react-router-dom";
import Resizer from "react-image-file-resizer";


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
            formData.append('image', file);
            console.log("attached image");
          }
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
            setFile(null);
          }
          else {
            setComment("err");
          }
        }
    }

    const resizeFile = (f) => new Promise(resolve => { //from stack exchange https://stackoverflow.com/questions/61740953/reactjs-resize-image-before-upload
      Resizer.imageFileResizer(f, 800, 800, 'JPEG', 100, 0,
      uri => {
        resolve(uri);
        console.log("done");
        //setTooLarge(false);
      }, 'base64' );
    });

    let uploadFile = async (e) => {
      if(e.size >= 1000000) {
        setTooLarge(true);
        console.log("resizing");
        let newFile = await resizeFile(e); //Resize image if too large
        setFile(newFile);
        setTooLarge(false);
      }
      else {
        console.log("all good");
        setFile(e);
      }
      
    };
    //URL.createObjectURL(file)
    let form;
    if(sessionData?.token){ //Comment Submission Form
      form = 
      <form onSubmit={postComment}  encType="multipart/form-data">
          <p>Post a Comment {comment ?  " - " + comment.length + "/1000" : ""}</p>
          <textarea className="commentBox TextField" maxLength="1000" type="text" onChange={e => setComment(e.target.value)} value={comment} />
          <br/>
          <img width="400" src={file ? file : ""} />
          <br/>
          <input type="file" name="file" onChange={e => uploadFile(e.target.files[0])}/>
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
    if(threadData.locked === 1) { //Thread status message (locked, etc...)
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

    return ( //Header
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
            {(tooLarge === true) ? <p style={{color: 'red'}}>Compressing File...</p> : ""}
        </div>
    );
}