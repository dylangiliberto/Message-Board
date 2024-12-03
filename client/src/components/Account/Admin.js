import React, { useState, useEffect } from 'react';
import '../../App.css'

export default function Account({ sessionData, setSessionData }) {

    const [permissionData, setPermissionData] = useState("");
    const [permDisplayTable, setpermDisplayTable] = useState();
    const [permTable, setPermTable] = useState([]);
    const [uploadStatus, setUploadStatus] = useState();
    const [newRoleN, setNewRoleN] = useState();
    const [newRoleD, setNewRoleD] = useState();
    const [newRoleP, setNewRoleP] = useState();
    const [newRoleA, setNewRoleA] = useState();
    const [roleStatus, setRoleStatus] = useState();



    useEffect(() => {
        async function f() {
            const url = "https://api.board.dylang140.com/getRolePermissionTable";
            let response;
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    }
                });
            }
            catch {
            }
            if(response?.status === 200) {
                response = await response.json();
                setPermissionData(response);
                setpermDisplayTable(generateTable(response));
            }
            else {
                
            }
        }
        f();
    }, []);

    const postPermTable = async e => {
        e.preventDefault();
        console.log("Posting Perm Table");
        let url = "https://api.board.dylang140.com/updatePermTable";
        let c = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(permTable)
        });
        if(c.status === 403) {
            setUploadStatus(false);
        }
        else if(c.ok) {
            setUploadStatus(true);
        }
        else {
            setUploadStatus(false);
        }
    }

    const addRole = async e => {
        e.preventDefault();
        console.log("Adding New Role");
        let url = "https://api.board.dylang140.com/addRole";
        let c = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: sessionData?.user?.username, SID: sessionData.token, roleName: newRoleN, roleDisplayName: newRoleD, rolePriority: newRoleP, roleAbreviation: newRoleA})
        });
        if(c.status === 403) {
            setRoleStatus(false);
        }
        else if(c.ok) {
            setRoleStatus(true);
        }
        else {
            setRoleStatus(false);
        }
    }

    let newRoleForm = (
        <form onSubmit={addRole}>
            <h3>New Role</h3>
            <label>Role Name</label><br/>
            <input type="text" name="Role Name" onChange={e => {setNewRoleN(e.target.value)}}/><br/>
            <label>Role Abreviation</label><br/>
            <input type="text" maxLength="4" name="Role Abrev" onChange={e => {setNewRoleA(e.target.value)}}/><br/>
            <label>Role Priority</label><br/>
            <input type="text" name="Role Priority" onChange={e => {setNewRoleP(e.target.value)}}/><br/>
            <label>Role Display Name</label><br/>
            <input type="text" name="Role Display Name" onChange={e => {setNewRoleD(e.target.value)}}/><br/>
            <input type="submit" />
        </form>
    );

    function generateTable(data) {
        let table = [data.perms.length];
        for(let i = 0; i < data.perms.length; i++){
            table[i] = [data.roles.length]
           for(let j = 0; j < data.roles.length; j++){
                table[i][j] = 0;
           }
        }
        //console.log(table);
        
        for(let i = 0; i < data.rolePerms.length; i++) {
            //Set table entry to role perm ID so it can be accessed in the checkbox form later
            table[data.rolePerms[i].permissionID - 1][data.rolePerms[i].roleID - 1] = data.rolePerms[i].role_permissionID;
        }
        
        setPermTable(table);
        return(
            <table style={{border: "solid 1px black", borderCollapse: "collapse"}}>
                <tbody>
                <tr key='a'>
                    <td style={{border: "solid 1px black", borderCollapse: "collapse"}}>Perm ID</td>
                    <td style={{border: "solid 1px black", borderCollapse: "collapse"}}>Perm Name</td>
                    {data.roles.map((role, index) => {
                        return <td key={index} style={{border: "solid 1px black", borderCollapse: "collapse"}}>{role.roleAbreviation}</td>;
                    })}
                    <td style={{border: "solid 1px black", borderCollapse: "collapse"}}>Permission Description</td>
                </tr>
                {table.map((i, index) => {
                   return (
                   <tr key={index}>
                        <td key='a' style={{border: "solid 1px black", borderCollapse: "collapse"}}>{data.perms[index].permissionID}</td>
                        <td key='a' style={{border: "solid 1px black", borderCollapse: "collapse"}}>{data.perms[index].permissionName}</td>
                        {i.map((j, indextwo) => {
                            //onChange={e => {let temp = permTable; temp[e.target.value[0]][e.target.value[1]] = (e.target.checked ? )}
                            return (
                                <td key={indextwo} style={{border: "solid 1px black", borderCollapse: "collapse"}}>
                                    <form><input type="checkbox" value={j} defaultChecked={j} onChange={e => {let temp = table; temp[index][indextwo] = (e.target.checked ? 1 : 0); setPermTable(temp);}}/></form>
                                </td>
                            )
                        })}
                        <td key='a' style={{border: "solid 1px black", borderCollapse: "collapse"}}>{data.perms[index].permissionDescription}</td>
                    </tr>)
                })}
                </tbody>
            </table>
        );
    }

    
    if(sessionData?.user?.administrator) {
        return(
            <div className="Page">
                <h2>Administrator Controls</h2>
                <h3>Manager Role Permissions</h3>
                {permDisplayTable ? permDisplayTable : ""}
                <form onSubmit={e => {postPermTable(e); console.log(permTable)}}>
                    <input type="submit" />
                    {uploadStatus === false ? <label style={{color:"red"}}>&nbsp;Error</label> : ""}
                    {uploadStatus === true ? <label style={{color:"green"}}>&nbsp;Success</label> : ""}
                </form>
                {newRoleForm}
            </div>
        );
    }
    return <h2>Please log in to see administrator controls</h2>;
}

