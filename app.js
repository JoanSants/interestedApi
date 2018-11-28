const express = require ('express');
const app = express();
const url = process.env.APP_URL;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect('mongodb+srv://InterestAdmin:'+ process.env.MONGO_ATLAS_PW +'@interessados-mmfsj.mongodb.net/interesteds?retryWrites=true',{ useNewUrlParser: true });

const userRoutes = require('./api/routes/users');
const interestRoutes = require('./api/routes/interests');
const categoryRoutes = require('./api/routes/categories');
const keyRoutes = require('./api/routes/keys');
const addressRoutes = require('./api/routes/addresses');
const itemRoutes = require('./api/routes/items');
const proposalRoutes = require('./api/routes/proposals');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use('/images', express.static('./api/images'));
app.use('/logs', express.static('./api/public/logs.txt'));

app.use((req, res, next) => {
    const dataLog = {
        method: req.method,
        ip: req.ip,
        hostname: req.hostname,
        status: res.statusCode,
        time: new Date()
        
    }   
    fs.appendFileSync('./api/public/logs.txt',JSON.stringify(dataLog));
    next();
})

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-type, Accept, Authorization"
    );
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({})
    }
    next();
})

app.use('/users', userRoutes);
app.use('/interests', interestRoutes);
app.use('/categories', categoryRoutes);
app.use('/keys', keyRoutes);
app.use('/addresses', addressRoutes);
app.use('/items', itemRoutes);
app.use('/proposals', proposalRoutes);

module.exports = app;