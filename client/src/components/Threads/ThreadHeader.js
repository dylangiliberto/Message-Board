import React, { useEffect, useState } from 'react';
import '../../App.css';
import '../../styles/commentViewer.css';
import {
  useParams,
  Navigate,
  Link
} from "react-router-dom";
import Resizer from "react-image-file-resizer";


const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function ThreadHeader({ sessionData, threadData, setComments }) {
  let [comment, setComment] = useState();
  let [file, setFile] = useState();
  let [tooLarge, setTooLarge] = useState(false);
  let [forbidden, setForbidden] = useState();
  let [unauth, setUnauth] = useState();

  let date = new Date(threadData['date_created']);
  let dateFormatted = months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

  const postComment = async e => {
      e.preventDefault();
      if(comment || file) {
        let tags = [];
        /* Tags - WIP
        if(comment.includes('@')) {
          comment.split('@').map((e, i) => {
            i = i + 1;
            let first = e.charCodeAt(0);
            if(i === 1) {
              //return e;
            }
            else if(!((first > 64 && first < 99) || (first > 96 && first < 123))) { //Alpha check before proceeding - tags need to start with letter, not num or space
              //return e;
            }
            else if(e.length > 1) { //Create and add link
              let tag = e.substring(0, e.indexOf(' ') > 0 ? e.indexOf(' ') : e.length); 
              if(!tags.includes(e)){
                tags.push(tag);
              }
            }
          });
        }

        console.log(tags);
        */
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
        //console.log(file);
        if(c.status === 403) {
          setForbidden(true);
        }
        else if(c.status === 401) {
          setUnauth(true);
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

  const resizeFile = (file) => new Promise(resolve => { //https://stackoverflow.com/questions/61740953/reactjs-resize-image-before-upload
    Resizer.imageFileResizer(file, 1000, 1000, 'PNG', 100, 0,
    uri => {
      resolve(uri);
    }, 'base64' );
  });

  function dataURItoBlob(dataURI) { //https://stackoverflow.com/questions/9388412/data-uri-to-object-url-with-createobjecturl-in-chrome-ff
    var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var binary = atob(dataURI.split(',')[1]);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
       array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: mime});
  }

  let uploadFile = async (e) => {
    //console.log(e);
    if(e.size >= 1000000) {
      setTooLarge(true);
      console.log("resizing");
      let newFile = await resizeFile(e); //Resize image if too large
      //console.log(newFile);
      setFile(dataURItoBlob(newFile));
      setTooLarge(false);
    }
    else {
      console.log("all good");
      setFile(e);
    }
  };
  
  let form;
  if(sessionData?.token){ //Comment Submission Form
    form = 
    <form onSubmit={postComment}  encType="multipart/form-data">
        <p>Post a Comment {comment ?  " - " + comment.length + "/1000" : ""}</p>
        <textarea className="commentBox TextField" maxLength="1000" type="text" onChange={e => setComment(e.target.value)} value={comment} />
        <br/>
        <img width="400" src={file ? URL.createObjectURL(file) : ""} />
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
  if(unauth) {
    return <Navigate replace to="/logout" />
  }
  else if(forbidden) {
    return <Navigate replace to="/forbidden" />
  }
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