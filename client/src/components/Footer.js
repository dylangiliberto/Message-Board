import React, { Component } from 'react';
import '../App.css';

export default function Footer({ server, siteVersion }) {
    let site = "";
    let style = "";
    if(server) {
        server = server['serverVersion'];
    }
    return (
        <footer className="Footer">
            {server === "" ? 
                <div>Status: <label style={{"color": "red"}}>  Offline</label>  Site Version: {siteVersion} Server Version: {server}</div> : 
                <div>Status: <label style={{"color": "green"}}> Online</label>  Site Version: {siteVersion} Server Version: {server}</div>}
            <br/>
        </footer>
    );
}
