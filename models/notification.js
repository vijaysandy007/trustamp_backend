const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User id is required']
    },
    deleted:{
        type: Boolean,
      default: false
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema)
module.exports = Notification;