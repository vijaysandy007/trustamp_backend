const Web3 = require('web3');
const web3 = new Web3(process.env.RPC_URL);
const ERC_20_ABI = require("./abi/ERC_20_ABI");
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const LINK_TOKEN_ADDRESS = process.env.LINK_TOKEN_ADDRESS;
const ESCROW_WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const confirmDelivery = async (document) => {
    try {

        const { orderId } = document;

        const documentContract = new web3.eth.Contract(ERC_20_ABI, CONTRACT_ADDRESS);
        const encodeABI = await documentContract.methods.confirmDelivery(
            orderId,
            LINK_TOKEN_ADDRESS
        ).encodeABI();

        const estimateGas = await documentContract.methods.confirmDelivery(
            orderId,
            process.env.LINK_TOKEN_ADDRESS
        ).estimateGas({ from: ESCROW_WALLET_ADDRESS });

        const gasPrice = await web3.eth.getGasPrice();

        let signTransactionParam = {
            from: ESCROW_WALLET_ADDRESS,
            data: encodeABI,
            gasPrice: gasPrice ? gasPrice : "3000000000",
            gas: (+estimateGas).toString(),
        }

        let createTransaction = await web3.eth.accounts.signTransaction(signTransactionParam, PRIVATE_KEY);

        const transactionPromise = new Promise((resolve, reject) => {

            web3.eth.sendSignedTransaction(createTransaction?.rawTransaction).once('transactionHash', async (hash) => {
                console.log("transactionHash event", hash);
            }).once('receipt', async (receipt) => {
                console.log("receipt event", receipt);
                resolve(receipt);
            }).on('error', (error) => {
                console.log("error event", error);
                reject(error);
            });
        })

        const result = await transactionPromise;
        if (Object.keys(result)?.length != 0) {
            return ({ status: 200, success: true, data: result, message: "Successfully processed signTransaction" });
        }
        console.log("Error @ transferFundFromBuyerToSeller : ", transactionPromise)
        return ({ success: false, message: "Failed to process signTransaction" })

    } catch (error) {
        console.log("Error @ transferFundFromBuyerToSeller : ", error)
        return ({ success: false, message: error?.message })
    }
}

module.exports = {
    confirmDelivery,
}