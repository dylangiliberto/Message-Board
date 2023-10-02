import React, { useState, useEffect } from 'react';
import '../App.css';
import '../styles/threadViewer.css';
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
        <tr key={row.ID} className="threadRow">
          <td className="threadCell"><Link to={`/space/` + row['ID']}>{row['title']}</Link></td>
          <td className="threadCell"><Link to={`/space/` + row['ID']}>{shortDesc}</Link></td>
          <td className="threadCell"><Link to={`/space/` + row['ID']}>{deletedMsg}</Link></td>
          <td className="threadCell"><Link to={`/space/` + row['ID']}>{row['displayName']}</Link></td>
          <td className="threadCell"><Link to={`/space/` + row['ID']}>{months[act.getMonth()] + " " + act.getDate() + " " + act.getFullYear()}</Link></td>
          <td className="threadCell"><Link to={`/space/` + row['ID']}>{months[created.getMonth()] + " " + created.getDate() + " " + act.getFullYear()}</Link></td>
        </tr>
      );
    }
  });
  let table = (
    <table className="threadTable">
      <thead>
        <tr>
          <th>Thread Title</th>
          <th>Thread Description</th>
          <td></td>
          <th>Creator</th>
          <th>Last Activity</th>
          <th>Date Created</th>
        </tr>
      </thead>
      <tbody>
        {tbody}
      </tbody>
    </table>
  );
  return table;
}

export default function ArchivedThreads({ sessionData }) {
  let [threads, setThreads] = useState();

  useEffect(() => {
    if(!threads){
      fetch("https://api.board.dylangiliberto.com/archivedThreads", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({requestDeleted: sessionData?.user?.administrator, username: sessionData?.user?.username})
      })
        .then((res) => res.json())
        .then((data) => setThreads(data.threads));
    }
  });

  return (
    <div className="Page">
      <h1>Archived Threads</h1>
      {!threads ? "" : getThreadTable(threads, sessionData?.user)} 
    </div>
  );
}
