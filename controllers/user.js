const User = require('../models/user');
const Notification = require('../models/notification');

class UserController {

    async login(req, res) {
        try {

            const { walletAddress, signature } = req.body;
            if (!walletAddress || !signature) {
                return res.status(400).send({ status: 400, success: false, message: "Login Failed" })
            }
            const ip = req.ip;
            const findUser = await User.findOne({ walletAddress: req.body.walletAddress });
            let user = findUser;

            if (!findUser) {
                user = new User({
                    walletAddress: req.body.walletAddress,
                    signature: req.body.signature
                })

                await user.save();
            }

            const token = await user.generateAuthToken();
            await new Notification({
                user_id: user._id,
                message: ip + " Logged In To " + "My Dex",
                title: "Login Successful",
                type: ""
            }).save();

            return res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24, httpOnly: false, secure: true }).json({ success: true, message: "Login Successful" });

        } catch (error) {
            console.log("Error@error", error?.message);
            return res.status(400).send({ status: 400, success: false, message: error.message ? error.message : "Login Failed" })
        }
    }

    async userInfo(req, res) {
        try {
            const user = await User.findOne({ _id: req.user._id }).select("-signature")
            return res.status(200).send({ success: true, data: user, message: 'User Info' })
        } catch (error) {
            console.log("Error @getUser : ", error);
            return res.status(400).send({ status: 400, success: false, message: "Failed to fetch the user list", error: error.message });
        }
    }

    async logout(req, res) {
        try {
            const user = await User.findOne({ _id: req.user._id })
            if (user) {
                return res.status(200).clearCookie('token').send({ success: true, message: 'LogOut Success !' })
            } else {
                return res.status(400).send({ status: 200, success: false, message: 'User Not Found' })
            }
        } catch {
            console.log("Error @ user signOut : ", error)
            return res.status(400).send({ staus: 400, success: false, message: 'Failed in Signout', error: error })
        }
    }

    async getallnotifications(req, res, next) {
        const limit = parseInt(req.body.limit)
        const page = parseInt(req.body.page)
        const skip = (page - 1) * limit
        let allnotification = await Notification.find({ user_id: req.user._id, deleted: false }).sort({ createdAt: -1 }).skip(skip).limit(limit)
        let totalCount = await Notification.find({ user_id: req.user._id, deleted: false }).countDocuments()
        let unReadCount = await Notification.find({ user_id: req.user._id, deleted: false, read: false }).countDocuments()
        res.status(200).json({ status: 200, success: true, count: totalCount, unReadCount: unReadCount, data: allnotification, message: 'Notification Details Fetch Success' })
    }

    async unReadNotifications(req, res) {
        try {
            let notification = await Notification.find({ user_id: req.user._id, deleted: false, read: false })
            return res.status(200).json({ status: 200, success: true, count: notification.length, data: notification, message: 'Unread Notification Details Fetch Success' })
        } catch (error) {
            console.log("Error @unReadNotifications : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Fetch the Unread Notifications", error: error.message })
        }
    }

    async readallnotifications(req, res) {
        const read = await Notification.updateMany({ "user_id": req.user._id, "read": false }, { "$set": { "read": true } });
        res.status(200).json({ success: true, data: read, message: 'Notifications readed' })
    }

}

module.exports = new UserController();