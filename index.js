// const express = require('express');
// const admin = require('firebase-admin');
// const serviceAccount = require('./firebase-adminsdk.json');
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });
// const app = express();
// app.use(express.json());
// app.get('/', (req, res) => {
//     res.send('Firebase Admin SDK is set up!');
// });

// app.post("/deleteuser/", (req, res) => {
//     console.log('state:', req.body); 
//     const uid = req.body.uid; 

//     if (!uid) {
//         return res.status(400).send('(UID) is required');
//     }
//     admin.auth().deleteUser(uid)
//         .then(() => {
//             console.log('Successfully deleted user');
//             res.status(200).send('Successfully deleted user');
//         })
//         .catch((error) => {
//             console.error('Error deleting user:', error);
//             res.status(500).send('Error deleting user: ' + error.message);
//         });
// });
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

const express = require('express');
const admin = require('firebase-admin');

// Import Firebase Admin SDK credentials
const serviceAccount = require('./firebase-adminsdk.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Create an Express application
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Root endpoint for testing API setup
app.get('/', (req, res) => {
    res.send('Firebase Admin SDK is set up!');
});

// Delete User Handler Function
const deleteUserHandler = async (req, res) => {
    try {
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: '(UID) is required' });
        }

        // Delete user in Firebase Authentication
        await admin.auth().deleteUser(uid);
        console.log(`Successfully deleted user with UID: ${uid}`);
        return res.status(200).json({ message: 'Successfully deleted user' });

    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Error deleting user: ' + error.message });
    }
};

// POST endpoint to delete user
app.post('/deleteuser/', deleteUserHandler);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
