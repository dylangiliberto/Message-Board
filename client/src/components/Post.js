import UserProfileDisplay from "./UserProfileDisplay";
import React, { useEffect, useState } from 'react';
import {
    useParams,
    Navigate,
    useLocation
} from "react-router-dom";

export default function Post({sessionData}) {
    const { postID } = useParams();
    let { state } = useLocation();
    let post = state.post;

    useEffect(() => {
        async function f() {
          let cUrl = "https://api.board.dylangiliberto.com/replies";
          let f = await fetch(cUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: sessionData?.user?.username, 
              SID: sessionData?.token, 
              id: post.ID,
              requestDeleted: sessionData?.user?.administrator})
          });
          console.log('TEST' + sessionData?.user?.username);
          console.log('TEST' + sessionData?.user?.administrator);
          if(f.status === 403) {
            //setForbidden(true);
          }
          else {
            let res = await f.json();
            
          }
        }
        f();
      }, []);

    return (
        <div className='Page'>
            <div>
                <UserProfileDisplay comment={post} />
                <h3>{post.body}</h3>
                <a href={'https://api.board.dylangiliberto.com/' + post['imageURL']} target='_blank'>
                {
                    post['imageURL'] && post['imageURL'] !== "No Image" 
                    ? 
                    <img className="image" src={"https://api.board.dylangiliberto.com/" + post['imageURL']}/>
                    : ""
                }
                </a>
            </div>
            <div>

            </div>
        </div>
    );
}