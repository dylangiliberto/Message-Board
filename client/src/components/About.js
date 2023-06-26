import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../App.css';

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
    </div>
  );
}