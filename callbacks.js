const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Endpoint to handle payment status updates
app.post('/payment-status', async (req, res) => {
  try {
    // Verify the request is from the payment provider
    // Replace with actual verification logic based on your payment provider's documentation

    const signature = req.headers['x-signature']; // Example header
    const payload = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', '41c2d6a2-e621-476d-b56c-ebbdd73d6fba') // Replace with your secret key
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid signature');
      res.status(401).send('Unauthorized');
      return;
    }

    const paymentId = req.body.paymentId;
    const newStatus = req.body.status; // Adjust based on actual data structure

    if (!paymentId || !newStatus) {
      res.status(400).send('Invalid request payload');
      return;
    }

    // Find the booking associated with this paymentId
    const bookingsRef = admin.firestore().collection('Bookings');
    const snapshot = await bookingsRef.where('paymentId', '==', paymentId).get();

    if (snapshot.empty) {
      console.log('No matching bookings.');
      res.status(404).send('No matching bookings found.');
      return;
    }

    // Update the paymentStatus in the booking document(s)
    snapshot.forEach(async (doc) => {
      await doc.ref.update({ paymentStatus: newStatus });
    });

    console.log(`Payment status updated for paymentId: ${paymentId} to ${newStatus}`);
    res.status(200).send('Payment status updated successfully.');
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
