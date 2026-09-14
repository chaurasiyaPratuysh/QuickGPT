import jwt from 'jsonwebtoken'
import User from '../models/user.js';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
    }

    try {
        const decode = jwt.verify(token, process.env.jWT_SECRET);
        const userId = decode.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: "Not authorized, user not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({
            message: "Not authorized, token failed"
        });
    }
};
