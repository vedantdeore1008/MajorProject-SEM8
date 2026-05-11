import User from "../../model/user.model.js";
import bcrypt from 'bcryptjs'
export const register=async(req,res)=>{
    try {
        const{name,email,password,role,profile_pic} = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'name, email, password and role are required', error: true });
        }
        const checkUser=await User.findOne({email});
        if(checkUser)
        {
            return res.status(400).json({
                message:"Username aleady exist",
                error:true
            });
        }
        // password encrytption
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            profile_pic
        });
        await newUser.save();
        return res.status(201).json({
            message: "User created successfully",
            data: newUser,
            success: true
        });
    } catch (error) {
        console.log("Error:",error);
        return res.status(500).json({ message: error.message || error });
    }
}