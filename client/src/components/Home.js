import React, { useState, useEffect } from 'react';
import '../App.css';
import '../styles/threadViewer.css';
import '../styles/tooltips.css';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
  Redirect,
  useLocation,
  renderMatches
} from "react-router-dom";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getThreadTable(data, user) {
  let tbody = data.map(row => {
    let act = new Date(row['last_activity']);
    let created = new Date(row['date_created']);
    if(!row.deleted || (row.username === user?.username) || (user?.administrator === 1)){
      let deletedMsg = (
        row.deleted === 1 ? <label style={{"color": "red"}}><i>Deleted</i></label> : ""
      );

      let shortDesc;
      if(row.description.length > 65)
        shortDesc = row.description.substring(0, 65) + " ...";
      else
        shortDesc = row.description
      
      return(
        <Link className="ThreadRowLink" to={`space/` + row['ID']}>
          <div className="threadRowDiv" style={{backgroundColor: row['deleted'] ? '#d2abab' : ''}}>
            <table className="threadRow"><tbody>
              <tr key={row.ID} className="threadRow">
                <td className="threadCell threadPinCell">{row['pinned'] === 1 ? "📌" : ""}<br/>{row['NumComments']} 💬 </td>
                <td className="threadCell threadTitleCell"><b>{row['title']}</b></td>
                <td className="threadCell threadDescCell">{shortDesc}</td>
                
                <td className="threadCell threadUserCell"><span style={{"color":('#' + row['displayNameHex'])}}>{row['displayName']}</span></td>
                <td className="threadCell threadActCell">{months[act.getMonth()] + " " + act.getDate() + " " + act.getFullYear()}</td>
                <td className="threadCell threadCreateCell">{months[created.getMonth()] + " " + created.getDate() + " " + act.getFullYear()}</td>
              </tr>
            </tbody></table>
          </div>
        </Link>
      );
    }
  });
  let table = (
    <div>
      <div>
      <table className="threadTable">
        <thead>
          <tr>
            <th className="threadCell threadPinCell"></th>
            <th className="threadCell threadTitleCell">Thread Title</th>
            <th className="threadCell threadDescCell">Thread Description</th>
            
            <th className="threadCell threadUsereCell">Creator</th>
            <th className="threadCell threadActCell">Last Activity</th>
            <th className="threadCell threadCreateCell">Date Created</th>
          </tr>
        </thead>
      </table>
      </div>
      {tbody}
    </div>    
  );
  return table;
}

export default function Home({ sessionData }) {
  let [threads, setThreads] = useState();

  useEffect(() => {
    if(!threads){
      fetch("http://dylangiliberto.com:3001/threads", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({requestDeleted: sessionData?.user?.administrator, username: sessionData?.user?.username})
      })
        .then((res) => res.json())
        .then((data) => setThreads(data.threads));
      //console.log(threads);
    }
  });

  return (
    <div className="Page">
      <table style={{width: '96%'}}><tbody><tr>
        <td>
          <h1>Spaces </h1>
        </td>
        <td>
          <div className='tooltip' style={{float: 'right'}}>
            <span className='tooltipcontents'>
              New Space
            </span>
            <Link to='/newThread' style={{textDecoration: 'none'}}>
              <h1>
                  +
              </h1>
            </Link>
          </div>
        </td>
      </tr></tbody></table>
      {!threads ? "" : getThreadTable(threads, sessionData?.user)} 
    </div>
  );
}


/*
<td>{row['title']}</td>
          <td>{row['description']}</td>
          <td>{row['username']}</td>
          <td>{row['last_activity']}</td>
          <td>{row['date_created']}</td>


td><Link to="/components/viewThread" state={{threadID: row['ID']}}>{row['description']}</Link></td>
          <td><Link to="/components/viewThread" state={{threadID: row['ID']}}>{row['username']}</Link></td>
          <td><Link to="/components/viewThread" state={{threadID: row['ID']}}>{months[act.getMonth()] + " " + act.getDate() + " " + act.getFullYear()}</Link></td>
          <td><Link to="/components/viewThread" state={{threadID: row['ID']}}>{months[created.getMonth()] + created.getDate() + " " + act.getFullYear()}</Link></td>
*/
