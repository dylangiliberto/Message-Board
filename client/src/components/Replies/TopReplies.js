import {
    useParams,
    Navigate,
    Link
} from "react-router-dom";

export default function TopReplies(){
    return (
        <div className='topRepliesBox'>
            <table><tbody><tr>
                <td>
                    <img src="../liked.png" height="10px" /> &nbsp;
                </td>
                <td>
                    <Link to='/user/DYlang140' className='Link'><i>Username</i></Link> &nbsp;
                </td>
                <td>
                    This is my reply hheheh
                </td>
            </tr></tbody></table>
            <table><tbody><tr>
                <td>
                    <img src="../liked.png" height="10px" /> &nbsp;
                </td>
                <td>
                    <Link to='/user/DYlang140' className='Link'><i>Username 2</i></Link> &nbsp;
                </td>
                <td>
                    This is my OTHER reply hheheh
                </td>
            </tr></tbody></table>
        </div>
    );
}