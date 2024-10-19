const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: [true, 'Wallet address is required']
    },
    signature: {
        type: String,
        required: [true, 'Signature is required']
    }
}, { timestamps: true });

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
        expiresIn: process.env.USER_EXPIRE
    })
    return token
}

const User = mongoose.model('User', userSchema)
module.exports = User

