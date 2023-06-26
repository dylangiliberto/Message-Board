import React, { Component, useState, useEffect } from 'react';
import './App.css';
import NavBarMain from './components/NavBar/NavBarMain';
import Header from './components/Header';
import Home from './components/Home';
import About from './components/About';
import Login from './components/Account/Login';
import Account from './components/Account/Account';
import useSession from './components/Account/useSession';
import ErrorPage from './components/ErrorPage';
import Root from './components/root';
import Logout from './components/Account/Logout';
import SignUp from './components/SignUp';
import UserAccount from './components/UserAccount';
import Footer from './components/Footer';
import NewThread from './components/NewThread';
import ArchivedThreads from './components/ArchivedThreads';
import Post from './components/Post';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import Thread from './components/Thread';

function App() {
  const { sessionData, setSessionData } = useSession();
  const [ user, setUser ] = useState({username: ""});
  const [ server, setServer ] = useState();
  let siteVersion = "3.6.0";

  useEffect(() => {
    async function f() {
      let url = "http://dylangiliberto.com:3001/status";
      let f = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if(f.status === 200) {
        let data = await f.json();
        //console.log(data);
        setServer(data);
      }
    }
    f();
    //console.log(sessionData);
  }, []);

  //console.log(user);

  return (
    <div className="siteWrapper">
      <Router>
        <Header />
        <NavBarMain sessionData={sessionData} /> 
        <br/> 
        <Routes>
          <Route path={"/"} element={<Home sessionData={sessionData} />} />
          <Route path={"/signup"} element={<SignUp />} />
          <Route path={"/about"} element={<About sessionData={sessionData} />} />
          <Route path={"/login"} element={<Login sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/Account"} element={<Account sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/logout"} element={<Logout sessionData={sessionData} setSessionData={setSessionData}/>} />
          <Route path={"/forbidden"} element={<Logout sessionData={sessionData} setSessionData={setSessionData} forbidden={true}/>} />
          <Route path={"/user/:username"} element={<UserAccount />} />
          <Route path={"/newthread"} element={<NewThread sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/archived"} element={<ArchivedThreads sessionData={sessionData} />} />
          <Route path="/space">
            <Route path=":threadID" element={<Thread sessionData={sessionData} />} />
          </Route>
          <Route path="/post">
            <Route path=":postID" element={<Post sessionData={sessionData} />} />
          </Route>
        </Routes>
        <Footer server={server} siteVersion={siteVersion}/>
      </Router>
    </div>
  );
  
}

export default App;
