const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Firebase Admin SDK is set up!');
});

app.post("/deleteuser/", (req, res) => {
    console.log('state:', req.body); 
    const uid = req.body.uid; 

    if (!uid) {
        return res.status(400).send('(UID) is required');
    }
    admin.auth().deleteUser(uid)
        .then(() => {
            console.log('Successfully deleted user');
            res.status(200).send('Successfully deleted user');
        })
        .catch((error) => {
            console.error('Error deleting user:', error);
            res.status(500).send('Error deleting user: ' + error.message);
        });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
