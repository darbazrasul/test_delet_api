const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const serviceAccount = require('./path/to/serviceAccountKey.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeOTP(email, otp) {
  const firestore = admin.firestore();
  const otpData = {
    otp,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), 
  };
  await firestore.collection('passwordResetOtps').doc(email).set(otpData);
}

async function verifyOTP(email, otp) {
  const firestore = admin.firestore();
  const docRef = firestore.collection('passwordResetOtps').doc(email);
  const doc = await docRef.get();

  if (!doc.exists) {
    return false;
  }

  const data = doc.data();
  const now = admin.firestore.Timestamp.now();

  if (data.otp === otp && data.expiresAt.toMillis() > now.toMillis()) {
    await docRef.delete();
    return true;
  } else {
    return false;
  }
}

// Request password reset route
app.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Invalid email address.');
  }

  try {
    const otp = generateOTP();
    const actionCodeSettings = {
      url: `https://yourapp.com/reset-password?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };
    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    await storeOTP(email, otp);
    const mailOptions = {
      to: email,
      from: '',
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('If the email is registered, a password reset email has been sent.');
  } catch (error) {
    console.error('Error generating password reset link:', error);
    res.status(200).send('If the email is registered, a password reset email has been sent.');
  }
});

// Verify OTP route
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValid = await verifyOTP(email, otp);

    if (!isValid) {
      return res.status(400).send({ message: 'Invalid or expired OTP.' });
    }

    res.status(200).send({ message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('Server error.');
  }
});

// Update password route (after OTP verification)
app.post('/update-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (newPassword.length < 6) {
    return res.status(400).send('Password must be at least 6 characters long.');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });

    res.status(200).send('Password has been updated successfully.');
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).send('Server error.');
  }
});

// Change password by UID route
app.post('/changepassword', async (req, res) => {
  const { uid, password } = req.body;

  if (!uid) {
    return res.status(400).send('(UID) is required');
  }
  if (!password) {
    return res.status(400).send('(Password) is required');
  }

  try {
    await admin.auth().updateUser(uid, {
      password: password
    });
    console.log('Successfully updated user');
    res.status(200).send('Successfully updated user');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Error updating user: ' + error.message);
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
