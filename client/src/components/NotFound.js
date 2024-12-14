import React, { Component } from 'react';
import PropTypes from 'prop-types';
import '../App.css';

export default function NotFound() {
  return (
    <div className="Page">
      <h1>404: Page Not Found</h1>
      <p className="TextBlock">
        What are you doing?
      </p>
      <img src="../gigi.jpg"/>
    </div>
  );
}