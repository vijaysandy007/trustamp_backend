const mongoose = require('mongoose');

const options = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(process.env.MONGODB_URL, options);

mongoose.connection.on('connected', () => {
    console.log("Mongoose connection is connected");
});

mongoose.connection.on('error', function(err) {
    console.log('Mongoose connection has occured ' + err + ' error');
});

mongoose.connection.on('disconnected', function() {
    console.log('Mongoose connection is disconnected');
});

process.on('SIGINT', function() {
    mongoose.connection.close(function() {
        console.log("Mongoose default connection is disconnected due to application termination");
        process.exit(0)
    });
});