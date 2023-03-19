require("dotenv").config()

const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json())

// Connect to your MongoDB instance
mongoose.connect(process.env.mongo);

// Define your schema
const dataSchema = new mongoose.Schema({
  DataStoreName: String,
  Key: String,
  Data: String,
});

var Access = process.env.accesskey

// Define your model
const DataReal = mongoose.model('Data', dataSchema);

app.get("/", function(req, res) {
  res.send("uptime")
})

app.head("/", function(req, res) {
  res.send("uptime")
})

app.post('/get', async (req, res) => {
    try {
        const accessKey = req.body.AccessKey;
        const dataStoreName = req.body.DataStoreName;
        const key = req.body.Key;

        // Verify access key
        if(accessKey !== Access) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        // Get datastore
        const dataStore = await DataReal.findOne({
            DataStoreName: dataStoreName
        });
        if(!dataStore) {
            return res.status(404).json({
                success: false,
                error: 'Datastore not found'
            });
        }

        // Get value for key
        const keyData = await DataReal.findOne({
            DataStoreName: dataStoreName,
            Key: key
        });
        if(!keyData) {
            // If key is not found, return null
            return res.json({
                success: true,
                data: null
            });
        }
        const data = keyData.Data;

        return res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

app.post('/save', async (req, res) => {
    const {
        AccessKey,
        DataStoreName,
        Key,
        Data
    } = req.body;

    // Check if the access key is valid
    if(AccessKey !== Access) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    try {
        // Find document with given DataStoreName and Key
        const existingData = await DataReal.findOne({
            DataStoreName,
            Key
        });

        if(existingData) {
            // Update existing document with new Data value
            existingData.Data = Data;
            await existingData.save();
        } else {
            // Create new document with given data
            const newData = new DataReal({
                DataStoreName,
                Key,
                Data
            });
            await newData.save();
        }

        res.json({
            success: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

app.post('/remove', async (req, res) => {
    const {
        AccessKey,
        DataStoreName,
        Key
    } = req.body;

    // Check if the access key is valid
    if(AccessKey !== Access) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    try {
        // Find document with given DataStoreName and Key and remove it
        await DataReal.findOneAndRemove({
            DataStoreName,
            Key
        });

        res.json({
            success: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

  
  

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
