import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
export  const getUserDetailsFromToken= async(token)=>{
    if (!token) {
        return null;
    }

    try {
        // we get userid and email from token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        // get user from userid
        const user = await User.findById(decoded.id).select("-password");
        return user || null;
    } catch (err) {
        return null;
    }
}