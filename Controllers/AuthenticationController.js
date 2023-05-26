const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const Log = require("../model/Log");
const UserToken = require("../model/UserToken");

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(400).send("Username not found");
        }

        let hashPassword = user.password;
        let userId = user.id;

        if (await bcrypt.compare(password, hashPassword)) {
            const accessToken = jwt.sign(username, process.env.AUTH_TOKEN_SECRET);

            const loginLog = new Log({
                user: userId,
                login: new Date(),               
            });

            await loginLog.save();

            saveToken(userId, accessToken);
            res.status(200).json({
                message: "Successfully Authenticated",
                access_token: accessToken,
            });
        } else {
            res.status(400).json({msg: "Invalid Credentials"});
        } 
    } catch(err) {
        throw err;
    }
};

const saveToken = async  (userId, access_token) => {
    const token = await UserToken.findOne({
        userId: userId,
        token: access_token,
    });

    if (!token) {
        await UserToken.create({
            userId: userId,
            token: access_token,
        });
    }
};

const logoutUser = async (req, res) => {
    const { user_id, access_token } = req.body;

    try {
        await UserToken.findOneAndDelete({ userId: user_id, token: access_token });

        const logoutLog = new Log({
            user: user_id,
            logout: new Date(),
        });
        await logoutLog.save();

        res.status(200).json({msg: "Log out Successfully"});       
    } catch (err) {
        throw err;
    }
};

module.exports = {
    loginUser,
    logoutUser
};