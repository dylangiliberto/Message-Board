import React, { useState, useEffect } from 'react';
import '../../App.css';

export default function UserAdminControls({ sessionData, setSessionData, username }) {
    const [data, setData] = useState();

    useEffect(() => {
        const url = "https://api.board.dylang140.com/logs";
        let sendData = {username: sessionData?.user?.username,
            SID: sessionData?.token, requestNum: 150, offsetNum: 0};

        const fetchData = async () => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(sendData)
                    })
                const json = await response.json();
                setData(json.user);
            } catch (error) {
                console.log("error", error);
            }
        };

        fetchData();
    }, [sessionData, username]);

    if(data != null) {
        return (
            <div className="Page">
                <h1>Logs</h1>
                <table>
                    <tr>
                        <td><b>ID&nbsp;</b></td>
                        <td><b>Time&nbsp;</b></td>
                        <td><b>User&nbsp;</b></td>
                        <td><b>Action&nbsp;</b></td>
                        <td><b>Action Item&nbsp;</b></td>
                        <td><b>IP Address&nbsp;</b></td>
                    </tr>
                    {data.map(row => {
                        let d = new Date(row.time);
                        return (<tr key={row.ID}>
                            <td>{row.ID}&nbsp;</td>
                            <td>{(d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours()+":"+d.getMinutes()}&nbsp;</td>
                            <td>{row.username}&nbsp;</td>
                            <td>{row.action}&nbsp;</td>
                            <td>{row.action_item_id}&nbsp;</td>
                            <td>{row.ip_address}&nbsp;</td>
                        </tr>);
                    })}
                </table>       
            </div>
        );
    }
    else {
        return <div>No Data</div>;
    }

}



