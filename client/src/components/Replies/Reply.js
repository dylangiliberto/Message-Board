import {
    useParams,
    Navigate,
    useLocation
} from "react-router-dom";
import UserProfileDisplay from "../UserProfileDisplay";

export default function Reply() {
    let { state } = useLocation();
    let reply = state.reply;
    return (
        <div className='reply'>
            <UserProfileDisplay comment={reply} mini='1' />
            This is the reply
        </div>
    );
}