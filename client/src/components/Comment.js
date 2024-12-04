import React, { useEffect, useState } from 'react';
import LikeButton from './LikeButton';
import '../styles/commentViewer.css';
import UserProfileDisplay from './UserProfileDisplay';
import {
    useParams,
    Navigate,
    Link,
    Redirect
} from "react-router-dom";
import TopReplies from './Replies/TopReplies';
import Post from './Post';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Comment({ comment, sessionData, threadID, setComments }) {
    let [forbidden, setForbidden] = useState(0);
    let [deletePerm, setDeletePerm] = useState(0);

    const handleDelete = async e => {
        e.preventDefault();
        
        let setDeleted = (comment.deleted === 1 ? 0 : 1);
        let url = "https://api.board.dylang140.com/deleteComment";
        let c = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {comment: comment, 
                    thread: threadID, 
                    username: sessionData.user.username, 
                    SID: sessionData.token, 
                    setDeleted: setDeleted, 
                    requestDeleted: sessionData?.user?.administrator})
        });
        let res = await c.json();
        if(c.ok) {
            //console.log(res);
            setComments(res);
        }
        else if(c.status === 403) {
            setForbidden(1);
        }
        setDeletePerm(0);
    }

    const handleDeletePerm = async e => {
        e.preventDefault();
        //deletePerm default is 0. On fist attempt, do nothing, set deletePerm to 1. If users confirms, then comment will be erased
        if(deletePerm === 1) {
            let url = "https://api.board.dylang140.com/deleteCommentPerm";
            let c = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {comment: comment.ID, 
                        thread: threadID, 
                        username: sessionData.user.username, 
                        SID: sessionData.token,  
                        requestDeleted: sessionData?.user?.administrator})
            });
            let res = await c.json();
            if(c.ok) {
                //console.log(res);
                setComments(res);
            }
            else if(c.status === 403) {
                setForbidden(1);
            }
        }
        else {
            setDeletePerm(1);
        }
    }

    let deleteButton = (
        <form onSubmit={handleDelete}>
            <input type="submit" className = "Button" value={comment.deleted === 1 ? "Restore" : "Delete"}/>
        </form>
    );

    let deletePermButton = (
        <form onSubmit={handleDeletePerm}>
            <input type="submit" 
            className = "Button" 
            value={deletePerm === 1 ? "Confirm?" : "Delete Permanently"} 
            style={{backgroundColor: deletePerm === 1 ? 'red' : ''}}/>
        </form>
    );

    let deletedMessage = (
        <span style={{color: 'red'}}>{comment.deleted === 1 ? "This Comment Was Deleted" : ""}</span>
    );

    if(forbidden === 1) {
        return <Navigate replace to="/forbidden" />;
    }

    let img = (
        comment['imageURL'] && comment['imageURL'] !== "No Image" 
        ? 
        <img loading="lazy" className="image" src={"https://api.board.dylang140.com/" + comment['imageURL']}/>
        : ""
    );

    let body = comment['body'];
    /*
    if(body.includes('@')) {
        let loc = body.indexOf('@');
        let tag = body.substring(loc, body.indexOf(' ', loc) > loc ? body.indexOf(' ', loc) : body.length); 
        if(tag.length > 1) {
            body = <span>{body.substring(0, loc)}<a href={'https://board.dylang140.com/user/' + tag.substring(1)}>{tag}</a>{body.substring(loc + tag.length)}</span>
        }
    }
    */
    if(body.includes('@')) {
        body = <span>{body.split('@').map((e, i) => {
            i = i + 1;
            let first = e.charCodeAt(0);
            if(i === 1) {
                return e;
            }
            else if(!((first > 64 && first < 99) || (first > 96 && first < 123))) { //Alpha check before proceeding - tags need to start with letter, not num or space
                return '@' + e;
            }
            else if(e.length > 1) { //Create and add link
                let tag = e.substring(0, e.indexOf(' ') > 0 ? e.indexOf(' ') : e.length); 
                return <span><a href={'https://board.dylang140.com/user/' + tag}>{'@'+tag}</a>{e.substring(tag.length)}</span>

            }
        })}</span>
    }
    
   /*
    let loc = body.indexOf('@');
    let temp = <span></span>;
    if(body.includes('@') && body.length > loc + 1) {
        
        let tag = body.substring(loc, body.indexOf(' ', loc) > loc ? body.indexOf(' ', loc) : body.length); 
        body = body.substring(loc);
        temp += <span>{body.substring(0, loc)}<a href={'https://board.dylang140.com/user/' + tag.substring(1)}>{tag}</a></span>

        loc = body.indexOf('@');
        while(loc > body.length) {
            tag = body.substring(loc, body.indexOf(' ', loc) > loc ? body.indexOf(' ', loc) : body.length); 
            body = body.substring(loc);
            temp += <span>{body.substring(0, loc)}<a href={'https://board.dylang140.com/user/' + tag.substring(1)}>{tag}</a></span>
        }
        temp += <span>{body}</span>
        console.log(temp);
    }
    */
    if(comment.deleted === 0 || sessionData.user.administrator === 1) {
        let date = new Date(comment['time_created']);
        let dateFormatted = months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
        
        return (
            
            <div className={comment['deleted'] ? 'commentWrapper commentDeleted' : 'commentWrapper'}>
                <UserProfileDisplay comment={comment}/>
                <div className='commentBodyWrapper'>
                    <div className='commentBody'>
                        {body}
                    </div>
                    <div className='commentImg'>
                        {img}
                    </div>
                </div>
                 
                <br/><br/>
                <table><tbody><tr>
                    <td>
                        <LikeButton 
                            className='likeButton'
                            initial={comment['like_ID']} 
                            initCount={comment['likes']} 
                            sessionData={sessionData} 
                            comment={comment['ID']} 
                            threadID={threadID} 
                        />
                    </td>
                   
                    <td>
                        {(sessionData?.user?.username === comment['username'] ||
                            sessionData?.user?.administrator == true)? 
                            deleteButton : <span></span>}
                    </td>
                    <td>
                        {comment['deleted'] ? deletePermButton : ""}
                    </td>
                </tr></tbody></table>
                <i>{dateFormatted}</i>
                <br/><br/>
                
            </div>
               
        );  
    }
}

/*
<Link to={'/post/' + comment['ID']} state={{post: comment}} className='Link'>

 <td>
    <Link to={'/post/' + comment['ID']} state={{post: comment}} className='Link'>
        ↩️
    </Link>
</td>

return (
            <tr className="commentRow">
                <td className="commentCell commentPfp">
                    {pfp}
                </td>
                <td className="commentCell commentUser">
                    <Link className="Link" to={"/user/" + comment['username']}>
                        <span style={{"color": '#' + comment['displayNameHex']}}>{comment['displayName']}</span>
                    </Link>
                    <br/>
                    {deletedMessage}
                    {((comment.username === sessionData?.user?.username && comment.deleted === 0) || (sessionData?.user?.administrator)) ? deleteButton : ""}
                </td>
                <td className="commentCell commenLike">
                    <LikeButton initial={comment['like_ID']} initCount={comment['likes']} sessionData={sessionData} comment={comment['ID']} threadID={threadID} />
                </td>
                <td className="commentCell commentBody">
                    <i>{dateFormatted}</i><br/><p className="commentBody">{comment['body']}<br/>{img}</p>
                </td>
            </tr>
        );
        */