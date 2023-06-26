import React, { Component } from 'react';
import { Outlet } from 'react-router-dom';
import '../App.css';
import NavBarMain from './NavBar/NavBarMain';
import Header from './Header';

class Root extends Component {
    render(){
        return (
            <div>
                <Header />
                <NavBarMain />
                <Outlet />
            </div>
          );
    }
}

export default Root;
