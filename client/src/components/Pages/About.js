import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../../App.css';

export default function About({ sessionData }) {
  return (
    <div className="Page">
      <h1>About</h1>
      <p className="TextBlock">
        Please keep all content on this site appropriate, including comments, thread titles and descriptions, usernames, display names, and user bios.
        All images, including profile pictures and comments, should be appropriate as well.
      </p>
      <p className="TextBlock">
        You should NOT use the same password as you do on other sites, as <b>the security of the data on this site cannot be guaranteed. </b>
        Please do not post any personal information such as addresses, email addresses, phone numbers, or passwords. 
      </p>
      Lines of Code
        Front-end: 2,967
        Back-end:  1,638
        Total:     4,605
      <p className='TextBlock'>
      <h3>Lines of Code </h3>
      </p>

      <b>Back-end:</b>  1,638
      <br/>
      <b>Front-end:</b> 2,967     
      <br/>
      <b>Total:</b>     4,605 
      <br/>
      <h3>Features</h3>
      <h4>Site Started</h4>
      October 2022 <br/>
      Running for {Math.round((Date.now() - new Date("October 2022")) / 3600000)} Hours
      <h4>Accounts</h4>
      <ul>
        <li>Register Account</li>
        <li>Log In/Out</li>
        <li>Password Reset (via email)</li>
        <li>Customize nickname (color, emojis, other characters)</li>
        <li>Profile pictures</li>
        <li>Account bio (short paragraph)</li>
        <li>View other users accounts</li>
      </ul>
      <h4>Back-End</h4>
      <ul>
        <li>NodeJS API (api.board.dylang140.com)</li>
        <li>MySQL Database</li>
        <li>Nginx Web Server</li>
        <li>Paswords encrypted before being stored</li>
        <li>Session-based user authentication</li>
        <li>User authentication on all requests</li>
      </ul>
      <h4>Admin Controls</h4>
      <ul>
        <li>Admin Accounts</li>
        <li>Delete/restore comments</li>
        <li>View deleted comments/threads</li>
        <li>Set users password</li>
        <li>Lock/unclock user accounts</li>
        <li>Log in as other users</li>
        <li>Edit roles/permissions (work in progress)</li>
        <li>View server logs on web page</li>
      </ul>
      <h4>Database</h4>
      <ul>
        <li>SQL-injection attack prevention</li>
        <li>Six regular data tables</li>
        <li>One relational table (likes)</li>
      </ul>
    </div>
  );
}