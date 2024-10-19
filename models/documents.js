const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    documet_name: {
        type: String
    },
    document: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Document is required']
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    orderId: {
        type: Number
    },
    token_decimalConverted: {
        type: String
    },
    price: {
        type: String
    },
    is_transfer_waiting: {
        type: Boolean
    },
    list_transactionhash: {
        type: mongoose.Schema.Types.Mixed
    },
    isListed: {
        type: Boolean,
        default: false
    },
    transfer_access_WalletAddress: {
        type: String
    }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema)
module.exports = Document