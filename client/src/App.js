import React, { Component, useState, useEffect } from 'react';
import './App.css';
import NavBarMain from './components/NavBar/NavBarMain';
import Header from './components/Header';
import Home from './components/Home';
import About from './components/Pages/About';
import Login from './components/Account/Login';
import Account from './components/Account/Account';
import useSession from './components/Account/Components/useSession';
import ErrorPage from './components/Pages/ErrorPage';
import Root from './components/root';
import Logout from './components/Account/Logout';
import SignUp from './components/Account/SignUp';
import UserAccount from './components/Profiles/UserAccount';
import Footer from './components/Footer';
import NewThread from './components/Threads/NewThread';
import Post from './components/Threads/Post';
import Admin from './components/Admin/Admin';
import ViewLogs from './components/Admin/ViewLogs';
import NotFound from './components/Pages/NotFound';
import ForgotPassword from './components/Account/ForgotPassword';
import ResetPassword from './components/Account/ResetPassword';
import Forbidden from './components/Pages/Forbidden';
import HomeNew from './components/HomeNew';
import Thread from './components/Threads/Thread';



import {
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

function App() {
  const { sessionData, setSessionData } = useSession();
  const [ user, setUser ] = useState({username: ""});
  const [ server, setServer ] = useState();
  let siteVersion = "3.6.0";

  useEffect(() => {
    async function f() {
      let url = "https://api.board.dylang140.com/status";
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
          <Route path={"/testing"} element={<HomeNew sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/signup"} element={<SignUp />} />
          <Route path={"/about"} element={<About sessionData={sessionData} />} />
          <Route path={"/login"} element={<Login sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/Account"} element={<Account sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/admin"} element={<Admin sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/admin/viewlogs"} element={<ViewLogs sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/logout"} element={<Logout sessionData={sessionData} setSessionData={setSessionData}/>} />
          <Route path={"/forbidden"} element={<Forbidden sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/user/:username"} element={<UserAccount sessionData={sessionData} setSessionData={setSessionData}/>} />
          <Route path={"/newthread"} element={<NewThread sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path={"/forgotpassword"} element={<ForgotPassword sessionData={sessionData} setSessionData={setSessionData} />} />
          <Route path="/passwordreset">
            <Route path=":resetcode" element={<ResetPassword sessionData={sessionData} />} />
          </Route>
          <Route path="/space">
            <Route path=":threadID" element={<Thread sessionData={sessionData} />} />
          </Route>
          <Route path="/post">
            <Route path=":postID" element={<Post sessionData={sessionData} />} />
          </Route>
          <Route path={"/*"} element={<NotFound/>} />
        </Routes>
        
      </Router>
    </div>
  );
  //<Route path={"/archived"} element={<ArchivedThreads sessionData={sessionData} />} />
  //<Footer server={server} siteVersion={siteVersion}/>
}

export default App;
