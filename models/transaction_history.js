const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
    document_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'From user is required']
    },
    fromUserStatus: {
        type: String
    },

    transfer_fundHash: {
        type: String
    },

    document_transferId: {
        type: String
    },

    toUserStatus: {
        type: String
    },
    transaction_hash: {
        type: String
    },
    transaction_details: {
        type: mongoose.Schema.Types.Mixed
    },
    toUser: {
        type: String,
        ref: 'User',
        required: [true, 'To wallet address is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required']
    }

}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema)
module.exports = Transaction;