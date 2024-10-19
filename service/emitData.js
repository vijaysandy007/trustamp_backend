const { getSocketId } = require("./socketFunctions");
const { getSocket } = require("./socket");
const Notification = require('../models/notification')
const User = require('../models/user')
const { sendMail } = require('../utils/accountMail')

const sendData = async (key, userId, data) => {
    const redisData = await getSocketId(userId, "USER");
    if (redisData) {
        const io = await getSocket();
        redisData.id.forEach((item) => {
            io.sockets.to(item).emit(key, data);
        });
    }
};

const newsFeedSocket = async (key, data) => {
    const io = await getSocket();
    io.sockets.emit(key, data);
}

const mqforSocket = async (ch) => {
    const q = 'socket_connect'
    await (await ch).assertQueue(q);
    await (await ch).consume(q, async (msg) => {
        if (msg !== null) {
            const qm = JSON.parse(msg.content.toString());
            await sendData(qm.key, qm.userId, qm.data);
        }
    }, {
        noAck: true
    })

}

const mqforNotification = async (ch) => {
    const q = 'notification_connect'
    await (await ch).assertQueue(q);
    await (await ch).consume(q, async (msg) => {
        if (msg !== null) {
            const qm = await JSON.parse(msg.content.toString());
            if (qm.userId && qm.userId !== null) {
                await new Notification({
                    notificationId: qm.notificationId,
                    user_id: qm.userId,
                    message: qm.data.message,
                    title: qm.data.title,
                    type: qm.data.notificationType
                }).save();
                let data = await Notification.find({ user_id: qm.userId, read: false });
                await sendData(qm.key, qm.userId, data);
            }
        } else {
            console.log("message missing========>>>>>>")
        }
    }, {
        noAck: true
    })
}

const mqforCustomNotificationMail = async (ch) => {
    const q = 'custom_notification_mail'
    await (await ch).assertQueue(q);
    await (await ch).consume(q, async (msg) => {
        if (msg !== null) {
            const qm = JSON.parse(msg.content.toString());

            const templateId = process.env.CUSTOM_NOTIFICATION_MAIL_TEMPLATE_ID
            const user = await User.findOne({ email: qm.email })
            const replacements = {
                username: user.name,
                title: qm.data.title,
                message: qm.data.message,
            };
            await sendMail(qm.email, templateId, replacements);

        }
    }, {
        noAck: true
    })
}

const sendCustomNotification = async (input) => {
    var q = 'notification_connect';
    switch (input.data.type) {
        case 'PUSH':
            input.key = "new_notification";
            await new Notification({
                notificationId: input.notificationId,
                user_id: input.userId,
                message: input.data.message,
                title: input.data.title,
                type: input.data.notificationType
            }).save();
            let data = await Notification.find({ user_id: input.userId, read: false });
            await sendData(input.key, input.userId, data);
            break;
        case 'MAIL':
            q = 'custom_notification_mail'
            const templateId = process.env.CUSTOM_NOTIFICATION_MAIL_TEMPLATE_ID
            const user = await User.findOne({ email: input.email })
            const replacements = {
                username: user.name,
                title: input.data.title,
                message: input.data.message,
            };
            await sendMail(input.email, templateId, replacements);
            break;
    }
}

const CurrentPriceSocket = async (key, data) => {
    const io = await getSocket();
    io.sockets.emit(key, data);
}

module.exports = {
    sendData,
    newsFeedSocket,
    CurrentPriceSocket,
    mqforSocket,
    mqforNotification,
    mqforCustomNotificationMail,
    sendCustomNotification
};