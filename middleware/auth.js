const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token
        console.log("token", token)
        console.log("token", {token:token, secret: process.env.JWT_SECRET})
        const decode = await jwt.verify(token, process.env.JWT_SECRET)
        console.log("decode", decode)
        const user = await User.findOne({ _id: decode._id })
        if (!user) {
            if(req.cookies.token) {
                res.clearCookie('token')
            }
            return res.status(401).send({ status: 401, success: false, message: 'Invalid Authentication' })
        }
        req.token = token
        req.user = user
        next()
    } catch (error) {
        console.log("AuthMiddleWareError", error.message ? error.message : error)
        return res.status(401).send({ status: 401, success: false, message: 'Invalid Authentication' })
    }
}

module.exports = auth