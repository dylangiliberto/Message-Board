import { useState } from 'react';

export default function useSession() {
  const getSessionData = () => {
    const session = window.localStorage.getItem('session');
    if(session) {
      //console.log("Found: " + session);
      return JSON.parse(session);
    }
  };

  const [sessionData, setSessionData] = useState(getSessionData());

  const saveSessionData = userSession => {
    window.localStorage.setItem('session', JSON.stringify(userSession));
    setSessionData(userSession);
    //console.log("Saving Token...");
    //console.log(userToken);
  };
  //console.log(sessionData);
  return {
    setSessionData: saveSessionData,
    sessionData
  }
}