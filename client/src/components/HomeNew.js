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

function getDummyTopics() {
  let dummytopic = (
    <div className="threadRowDiv lazyLoadingEffect">
      <table className="threadRow"><tbody>
        <tr className="threadRow">
          <td className="threadCell threadPinCell"> &nbsp; <br/> &nbsp; </td>
          <td className="threadCell threadTitleCell"><b> </b></td>
          <td className="threadCell threadDescCell"> </td>
          
          <td className="threadCell threadUserCell"><span> </span></td>
          <td className="threadCell threadActCell"> </td>
          <td className="threadCell threadCreateCell"> </td>
        </tr>
      </tbody></table>
    </div>
  );

  let table = (
    <div>
      <div>
      <table className="threadTable">
        <thead>
          <tr>
            <th className="threadCell threadPinCell"></th>
            <th className="threadCell threadTitleCell">thread Title</th>
            <th className="threadCell threadDescCell">thread Description</th>
            <th className="threadCell threadUsereCell">Creator</th>
            <th className="threadCell threadActCell">Last Activity</th>
            <th className="threadCell threadCreateCell">Date Created</th>
          </tr>
        </thead>
      </table>
      </div>
      {dummytopic}{dummytopic}{dummytopic}
      {dummytopic}{dummytopic}{dummytopic}
      {dummytopic}{dummytopic}{dummytopic}
    </div>    
  );
  return table;
}

function getTopicTable(data, user) {
  let tbody = data.map(row => {
    let act = new Date(row['last_activity']);
    let created = new Date(row['date_created']);
    if(!row.deleted || (row.username === user?.username) || (user?.administrator === 1)){
      let deletedMsg = (
        row.deleted === 1 ? <label style={{"color": "red"}}><i>Deleted</i></label> : ""
      );

      let shortDesc = "";
      if(row.info.length > 65)
        shortDesc = row.info.substring(0, 65) + " ...";
      else
        shortDesc = row.info
      
      return(
        <Link className="ThreadRowLink" to={`space/` + row['ID']}>
          <div className="threadRowDiv" style={{backgroundColor: row['deleted'] ? '#d2abab' : ''}}>
            <table className="threadRow"><tbody>
              <tr key={row.ID} className="threadRow">
                <td key={row.ID + "a"} className="threadCell threadPinCell">{row['pinned'] === 1 ? "📌" : ""}<br/>{row['num_posts']} 💬 </td>
                <td key={row.ID + "b"} className="threadCell threadTitleCell"><b>{row['title']}</b></td>
                <td key={row.ID + "c"} className="threadCell threadDescCell">{shortDesc}</td>
                
                <td key={row.ID + "d"} className="threadCell threadUserCell">{row.username}</td>
                <td key={row.ID + "e"} className="threadCell threadActCell">{months[act.getMonth()] + " " + act.getDate() + ", " + act.getFullYear()}</td>
                <td key={row.ID + "f"} className="threadCell threadCreateCell">{months[created.getMonth()] + " " + created.getDate() + ", " + created.getFullYear()}</td>
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
          <tr key={"head"}>
            <th key={"heada"} className="threadCell threadPinCell"></th>
            <th key={"headb"} className="threadCell threadTitleCell">Topic </th>
            <th key={"headc"} className="threadCell threadDescCell">Description</th>
            
            <th key={"headd"}className="threadCell threadUsereCell">Creator</th>
            <th key={"heade"} className="threadCell threadActCell">Last Activity</th>
            <th key={"headf"} className="threadCell threadCreateCell">Date Created</th>
          </tr>
        </thead>
      </table>
      </div>
      {tbody}
    </div>    
  );
  return table;
}

export default function HomeNew({ sessionData }) {
  let [topics, setTopics] = useState();
  let [topicsPage, setTopicsPage] = useState(0);
  let [countTopics, setCountTopics] = useState(60);
  let [load, setLoad] = useState(true);
  let [hasNextPage, setHasNextPage] = useState(true);
  let [hasPrevPage, setHasPrevPage] = useState(false);

  const topicsPerPage = 10;

  useEffect(() => {
    if(!topics || load == true){
      setLoad(false);
      fetch("https://api.board.dylang140.com/topicsPage", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({requestDeleted: sessionData?.user?.administrator, username: sessionData?.user?.username, requestNum: topicsPerPage, requestStart: topicsPage*topicsPerPage})
      })
        .then((res) => res.json())
        .then((data) => {
          setCountTopics(data.topicsCount);
          setTopics(data.topics);
        });
    }
  });

  const nextPage = () => {
    //let newCount = (countTopics / 20) - 1 > topicsPage ? topicsPage + 1 : topicsPage;
    if((countTopics / topicsPerPage) - 1 > topicsPage) {
      //console.log(topicsPage + " "  + " " + load);
      setTopicsPage(topicsPage + 1);
      setLoad(true);
      setHasPrevPage(true);
    }
    else {
      setHasNextPage(false);
    }
  }
  const prevPage = () => {
    let newCount = topicsPage > 0 ? topicsPage - 1 : 0;
    //console.log(topicsPage + " " + newCount + " " + load);
    if(newCount != topicsPage) {
      setTopicsPage(newCount);
      setLoad(true);
      setHasNextPage(true);
    }
    else {
      setHasPrevPage(false);
    }
  }

  let nextButton = (<div>Next<input type="image" src="../nextArrow.png" height="30px" onClick={() => nextPage()}style={{verticalAlign: 'middle'}} /></div>);
  let prevButton = (<div><input type="image" src="../prevArrow.png" height="30px" onClick={() => prevPage()} style={{verticalAlign: 'middle'}}/>Previous</div>);
  let dumbButton = (<button className="Button">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button>);
  let buttons = (
    <div style={{margin: 'auto', width: '50%', padding: '10px', textAlign: 'center'}}>
      {hasPrevPage ? prevButton : dumbButton}
      &nbsp; Page {topicsPage + 1} &nbsp;
      {hasNextPage ? nextButton : dumbButton}
    </div>
  );

  return (
    <div className="Page">
      <table style={{width: '100%'}}><tbody>
        <tr key={"space"}>
          <td>
            <h1>Topics</h1>
          </td>
          <td>
            <div className='tooltip' style={{float: 'right'}}>
              <span className='tooltipcontents'>
                New Topic
              </span>
              <Link to='/newtopic' style={{textDecoration: 'none'}}>
                <h1>
                    +
                </h1>
              </Link>
            </div>
          </td>
        </tr>
        <tr key={"nav"}>
          <td>
            {prevButton}
          </td>
          <td>
            <div className='tooltip' style={{float: 'right'}}>
             {nextButton}
            </div>
          </td>
        </tr>
      </tbody></table>
      {!topics ? getDummyTopics() : getTopicTable(topics, sessionData?.user)} 
      <br/>
      <table style={{width: '100%'}}><tbody>
        <tr key={"nav"}>
          <td>
            {prevButton}
          </td>
          <td>
            <div className='tooltip' style={{float: 'right'}}>
             {nextButton}
            </div>
          </td>
        </tr>
      </tbody></table>
    </div>
  );
}