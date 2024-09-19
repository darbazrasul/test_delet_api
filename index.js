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

const createCustomTokenHandler = async (req, res) => {
    try {
        const { uid } = req.body; 
        if (!uid) {
            return res.status(400).json({ error: '(UID) is required' });
        }
        const customToken = await admin.auth().createCustomToken(uid);
        console.log(`Custom token created for UID: ${uid}`);
        return res.status(200).json({ token: customToken });
    } catch (error) {
        console.error('Error creating custom token:', error);
        return res.status(500).json({ error: 'Error creating custom token: ' + error.message });
    }
};

const deleteUserHandler = async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: '(UID) is required' });
        }
        await admin.auth().deleteUser(uid);
        console.log(`Successfully deleted user with UID: ${uid}`);
        return res.status(200).json({ message: 'Successfully deleted user' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Error deleting user: ' + error.message });
    }
};

async function sendPasswordReset(email) {
    if (!email) {
        throw new Error('Email is required');
    }

    // Send password reset email using Firebase Authentication
    const auth = admin.auth();
    await auth.sendPasswordResetEmail(email);
}
app.post('/sendPasswordReset', async (req, res) => {
    const { email } = req.body;

    try {
        await sendPasswordReset(email);
        return res.status(200).json({ message: 'Password reset link sent successfully!' });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return res.status(500).json({ error: 'Failed to send password reset email: ' + error.message });
    }
}); 

app.post('/createCustomToken', createCustomTokenHandler); 
app.post('/deleteuser', deleteUserHandler);  

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
 });

// const express = require('express');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// const admin = require('firebase-admin');
// require('dotenv').config(); 

// const serviceAccount = require('./firebase-adminsdk.json'); 

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

// const app = express();
// app.use(express.json());

// const otpStorage = new Map();


// const sendOtpEmail = async (email, otp) => {
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.EMAIL_USER, 
//             pass: process.env.EMAIL_PASS, 
//         }
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Your OTP Code',
//         text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
//     };

//     await transporter.sendMail(mailOptions);
// };

// const generateOtp = () => {
//     return crypto.randomInt(100000, 999999).toString(); 
// };

// app.post('/sendOtp', async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ error: 'Email is required' });
//     }

//     try {
//         const otp = generateOtp();

//         otpStorage.set(email, { otp, createdAt: Date.now() });

//         await sendOtpEmail(email, otp);

//         return res.status(200).json({ message: 'OTP sent successfully' });
//     } catch (error) {
//         console.error('Error sending OTP:', error);
//         return res.status(500).json({ error: 'Failed to send OTP' });
//     }
// });

// app.post('/verifyOtp', (req, res) => {
//     const { email, otp } = req.body;
//     if (!email || !otp) {
//         return res.status(400).json({ error: 'Email and OTP are required' });
//     }

//     const storedOtpDetails = otpStorage.get(email);

//     if (!storedOtpDetails) {
//         return res.status(400).json({ error: 'OTP not found or expired' });
//     }

//     const { otp: storedOtp, createdAt } = storedOtpDetails;

//     const isOtpValid = storedOtp === otp && Date.now() - createdAt < 300000;

//     if (isOtpValid) {
//         otpStorage.delete(email);
//         return res.status(200).json({ message: 'OTP verified successfully' });
//     } else {
//         return res.status(400).json({ error: 'Invalid OTP or expired' });
//     }
// });

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
