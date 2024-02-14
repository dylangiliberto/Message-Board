import {
    useParams,
    Navigate,
    Link
} from "react-router-dom";

export default function UserProfileDisplay({comment, mini}) {
    if(!mini) {
        return (
            <table><tbody><tr>
                <td>
                    <Link className="Link" to={"/user/" + comment['username']}>
                        {comment['pfpURL'] && comment['pfpURL'] !== "" ? 
                        <img className="pfp" src={"https://api.board.dylang140.com/" + comment['pfpURL']} /> : 
                        <img className="pfp" src="../pfp_default.png" />}
                    </Link>  
                </td>
                <td>
                    <Link className="Link" to={"/user/" + comment['username']}>
                        <span style={{"color": '#' + comment['displayNameHex']}}>{comment['displayName']}</span>
                    </Link>
                </td>
            </tr></tbody></table>
        );
    }
    return (
        <table><tbody><tr>
            <td>
                <Link className="Link" to={"/user/" + comment['username']}>
                    {comment['pfpURL'] && comment['pfpURL'] !== "" ? 
                    <img className="pfp minipfp" src={"https://api.board.dylang140.com/" + comment['pfpURL']} /> : 
                    <img className="pfp minipfp" src="../pfp_default.png" />}
                </Link>  
            </td>
            <td>
                <Link className="Link" to={"/user/" + comment['username']}>
                    <span style={{"color": '#' + comment['displayNameHex']}}>{comment['displayName']}</span>
                </Link>
            </td>
        </tr></tbody></table>
    );
}