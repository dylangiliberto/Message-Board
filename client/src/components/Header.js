import React, { Component } from 'react';
import { NavLink } from "react-router-dom";
import '../App.css';

class Header extends Component {
    render(){
        return (
            <div className="Header">
              <h1>
                <NavLink to="/" style={{textDecoration:"none", color:"black"}}>Message Board</NavLink>
              </h1>
            </div>
          );
    }
}

export default Header;
