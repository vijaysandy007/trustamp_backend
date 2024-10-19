require('dotenv').config({ path: __dirname + '/config/.env.example' });
const express = require('express');
const useragent = require('express-useragent');
const expressip = require('express-ip');
const cookieParser = require('cookie-parser');
require('./config/db')

const app = express();
app.use(express.json());
const port = process.env.PORT || 4009

const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:4300'
];


app.use(function (req, res, next) {
    const allowedOrgins = ['http://localhost:4200', 'http://localhost:4300'];
    const origin = req.headers.origin;
    if (allowedOrgins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next();
})

app.use(expressip().getIpInfoMiddleware);
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(useragent.express())

const userRouter = require("./routers/user");
const documentRouter = require("./routers/document");

app.use(userRouter);
app.use(documentRouter);

const server = app.listen(port, () => {
    console.log(process.env.PLATFORM_NAME + " - Running on port : ", `${port}`);
})

process.on('unhandledRejection', (err, Promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});