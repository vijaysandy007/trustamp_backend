const DocumentModel = require("../models/documents");
const Notification = require("../models/notification");
const TransactionHistory = require("../models/transaction_history");
const { confirmDelivery } = require("../service/web3/transactions");
const EmitData = require("../service/emitData");

class DocumentController {

    async createDocument(req, res) {

        try {
            const { document, transfer_access_WalletAddress, price, documet_name } = req.body

            const RequestedFields = ["document", "transfer_access_WalletAddress", "price", "documet_name"];
            RequestedFields.forEach((field) => {
                if (!req.body[field]) {
                    return res.status(400).send({ status: 400, success: false, message: `${field} is required` })
                }
            })

            const createDoc = new DocumentModel({
                document: document,
                documet_name: documet_name,
                transfer_access_WalletAddress: transfer_access_WalletAddress,
                user_id: req.user._id,
                price: price
            })
            await createDoc.save();

            await new Notification({
                user_id: req.user._id,
                message: `${createDoc.documet_name} Document created Successfully`,
                title: "Unlisted document"
            }).save();

            return res.status(200).send({ success: true, message: "Document Created Successfully", data: createDoc })
        } catch (error) {
            console.log("Error @ createDocument : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Create Document", error: error })
        }
    }

    async getAllUserDocuments(req, res) {
        try {
            const { limit, page } = req.body;
            const skip = (page - 1) * limit
            const documents = await DocumentModel.find({ user_id: req.user._id }).skip(skip).limit(limit)
            let totalCount = await DocumentModel.countDocuments({ user_id: req.user._id })
            return res.status(200).send({ success: true, message: "Documents Fetch Successfully", count: totalCount, data: documents })
        } catch (error) {
            console.log("Error @ getAllUserDocuments : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Fetch Documents", error: error })
        }
    }

    async marketPlaceDocuments(req, res) {
        try {
            const { limit, page } = req.body;
            const skip = (page - 1) * limit
            const documents = await DocumentModel.find({ isListed: true }).populate("user_id", "-signature").skip(skip).limit(limit)
            let totalCount = await DocumentModel.countDocuments({ isListed: true })
            return res.status(200).send({ success: true, message: "Documents Fetch Successfully", count: totalCount, data: documents })
        } catch (error) {
            console.log("Error @ marketPlaceDocuments : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Fetch Documents", error: error })
        }
    }

    async listDocument(req, res) {
        try {
            const { document_id, transactionHash, orderId, token_decimalConverted } = req.body;
            const RequestedFields = ["document_id", "transactionHash", "orderId", "token_decimalConverted"]
            RequestedFields.forEach((field) => {
                if (!req.body[field]) {
                    return res.status(400).send({ status: 400, success: false, message: `${field} is required` });
                }
            })

            const document = await DocumentModel.findOne({ _id: document_id, user_id: req.user._id });
            if (!document) {
                return res.status(400).send({ status: 400, success: false, message: "Document Not Found" });
            }
            if (document.list_transactionhash) return res.status(400).send({ success: false, message: "Document already listed" })

            // if (!list?.success) return res.status(400).json({ success: false, message: list?.message });
            document.isListed = true;
            document.list_transactionhash = transactionHash;
            document.orderId = orderId;
            document.token_decimalConverted = token_decimalConverted;
            await document.save();

            await new Notification({
                user_id: req.user._id,
                message: `${document.documet_name} Document listed Successfully`,
                title: "Unlisted document"
            }).save();

            return res.status(200).send({ success: true, message: "Document Listed Successfully", data: document });
        } catch (error) {
            console.log("Error @ listDocument : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to List Document", error: error });
        }
    }

    async unlistDocument(req, res) {
        try {
            const { document_id } = req.body;
            const RequestedFields = ["document_id"]
            RequestedFields.forEach((field) => {
                if (!req.body[field]) {
                    return res.status(400).send({ status: 400, success: false, message: `${field} is required` })
                }
            })

            const document = await DocumentModel.findOne({ _id: document_id, user_id: req.user._id, isListed: true });
            if (!document) {
                return res.status(400).send({ status: 400, success: false, message: "Document Not Found" })
            }
            document.isListed = false;
            document.list_transactionhash = undefined;
            await document.save();
            await new Notification({
                user_id: req.user._id,
                message: `${document.documet_name} Document Unlisted Successfully`,
                title: "Unlisted document"
            }).save();

            return res.status(200).send({ success: true, message: "Document Unlisted Successfully", data: document });
        } catch (error) {
            console.log("Error @ unlistDocument : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Unlist Document", error: error });
        }
    }

    async approveHoldFund(req, res) {
        try {

            const { document_id,transaction_hash } = req.body;

            const findDoc = await DocumentModel.findOne({ _id: document_id }).populate("user_id");
            if (!findDoc) {
                return res.status(400).send({ status: 400, success: false, message: "Document Not Found" })
            }

            const createHistory = new TransactionHistory({
                fromUser: findDoc?.user_id?._id,
                toUser: req.user._id,
                document_id: findDoc?._id,
                amount: findDoc?.price,
                fundHold_hash: transaction_hash,
                fromUserStatus: "PENDING",
                toUserStatus: "REQUESTED",
            })
            await createHistory.save();
            findDoc.is_transfer_waiting = true;
            await findDoc.save();
            EmitData.sendData('refresh_notification', findDoc?.user_id?._ids, createHistory);
            EmitData.sendData('refresh_notification', req.user._id, createHistory);
            return res.status(200).send({ success: true, message: "Buyer Fund Hold Approved Successfully", data: findDoc })

        } catch (error) {
            console.log("Error @ approveHoldFund : ", error)
            return res.status(400).send({ success: false, message: "Failed to Approve Hold Fund", error: error })
        }
    }

    async transferFund(req, res) {
        try {
            const { transaction_id } = req.body;
            const findhistory = await TransactionHistory.findOne({ _id: transaction_id }).populate("fromUser").populate("toUser")
                .populate("document_id");

            if (findhistory.fromUser?._id?.toString() != req.user._id?.toString()) {
                return res.status(400).send({ status: 400, success: false, message: "Unauthorized Access" })
            }

            if (!findhistory) {
                return res.status(400).send({ status: 400, success: false, message: "Transaction History Not Found" })
            }

            const transfer = await confirmDelivery(findhistory?.document_id);
            if (!transfer?.success) {
                return res.status(400).send({ status: 400, success: false, message: "Failed to Change Document Ownership", error: transfer?.error })
            }
            const { transactionHash } = transfer?.data;
            findhistory.transfer_fundHash = transactionHash;
            await findhistory.save();

            return res.status(200).json({
                success: true, message:
                    "Fund Transfer was successfull from buyer to seller, now transfer the document from seller to buyer",
                data: findhistory
            });

        } catch (error) {
            console.log("Error@transferFund", error);
            return res.status(400).send({ status: 400, success: false, message: "Failed to Change Document Ownership", error: error })

        }
    }

    async changeDocumentOwnerShip(req, res) {

        try {

            const { history_id, document_transferId } = req.body;
            if (!document_transferId) {
                return res.status(400).send({ status: 400, success: false, message: "document_transferId is required" });
            }
            const findhistory = await TransactionHistory.findOne({ _id: history_id }).populate("fromUser").populate("toUser");

            if (!findhistory) {
                return res.status(400).send({ status: 400, success: false, message: "Transaction History Not Found" })
            }

            if (findhistory.fromUser?._id?.toString() != req.user._id?.toString()) {
                return res.status(400).send({ status: 400, success: false, message: "Unauthorized Access" })
            }

            const findDoc = await DocumentModel.findOne({ _id: findhistory?.document_id }).populate("user_id");
            if (!findDoc) {
                return res.status(400).send({ status: 400, success: false, message: "Document Not Found" })
            }

            findDoc.user_id = findhistory.toUser._id;
            findDoc.isListed = false;
            await findDoc.save();

            findhistory.document_transferId = document_transferId;
            findhistory.fromUserStatus = "APPROVED";
            findhistory.toUserStatus = "SUCCESS";
            await findhistory.save();

            await new Notification({
                user_id: findhistory.toUser._id,
                message: `${findDoc.documet_name} Document succcessfully reacived from ${findhistory?.fromUser?.walletAddress}`,
                title: "Ownership Changed document"
            }).save();

            await new Notification({
                user_id: findhistory?.fromUser?._id,
                message: `${findDoc.documet_name} Document successfully transferred to ${findhistory?.toUser?.walletAddress}`,
                title: "Ownership Changed document"
            }).save();

            EmitData.sendData('refresh_notification', req.user._id, findhistory);
            EmitData.sendData('refresh_notification', findhistory.toUser._id, findhistory);
            res.status(200).send({ success: true, message: "Document Ownership Changed Successfully", data: findhistory })

        } catch (error) {
            console.log("Error @ changeDocumentOwnerShip : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Change Document Ownership", error: error })
        }
    }

    async getTransactionHistory(req, res) {
        try {
            const { limit, page } = req.body;
            const skip = (page - 1) * limit
            const history = await TransactionHistory.find({ $or: [{ fromUser: req.user._id }, { toUser: req.user._id }] })
                .populate("document_id").populate("fromUser", "walletAddress").populate("toUser", "walletAddress").skip(skip).limit(limit);

            let totalCount = await TransactionHistory.countDocuments({ $or: [{ fromUser: req.user._id }, { toUser: req.user._id }] })
            return res.status(200).send({ success: true, message: "Transaction History Fetch Successfully", count: totalCount, data: history })
        } catch (error) {
            console.log("Error @ getTransactionHistory : ", error)
            return res.status(400).send({ status: 400, success: false, message: "Failed to Fetch Transaction History", error: error })
        }
    }

}

module.exports = new DocumentController();