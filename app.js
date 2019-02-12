const express = require ('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://InterestAdmin:'+ process.env.MONGO_ATLAS_PW +'@interessados-mmfsj.mongodb.net/interesteds?retryWrites=true',{ useNewUrlParser: true, useCreateIndex: true});

const userRoutes = require('./api/routes/users');
const interestRoutes = require('./api/routes/interests');
const keyRoutes = require('./api/routes/keys');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(morgan('tiny'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-type, Accept, Authorization, x-auth"
    );
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({})
    }
    next();
})

app.use('/users', userRoutes);
app.use('/interests', interestRoutes);
app.use('/keys', keyRoutes);

module.exports = app;