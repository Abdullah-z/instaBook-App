// send-notifications.js
// Run with: node notification.js

const mongoose = require('mongoose');
const { Expo } = require('expo-server-sdk');

// ——————————————————————————————————————
// CONFIGURATION
// ——————————————————————————————————————
// Use the same MONGODB_URL as your server
const MONGODB_URL =
  'mongodb+srv://abdullah:abdullah123@cluster0.b0w5j.mongodb.net/social-media?retryWrites=true&w=majority';

const NOTIFICATION_MESSAGE = {
  title: 'Test Notification',
  body: 'This is a test message sent to ALL users!',
  sound: 'default',
  priority: 'high',
  channelId: 'default',
};

// ——————————————————————————————————————
// MODELS
// ——————————————————————————————————————
// Minimal User Schema to fetch pushToken
const userSchema = new mongoose.Schema({
  username: String,
  pushToken: String,
});
const User = mongoose.model('User', userSchema);

// ——————————————————————————————————————
// MAIN SCRIPT
// ——————————————————————————————————————
const expo = new Expo();

async function sendToAllUsers() {
  try {
    console.log('Connecting to Database...');
    await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Custom DB Connected!');

    // 1. Fetch all users with a push token
    console.log('Fetching users with push tokens...');
    const users = await User.find({
      pushToken: { $exists: true, $ne: '' },
    });

    if (users.length === 0) {
      console.log('⚠️ No users found with push tokens.');
      process.exit(0);
    }

    console.log(`found ${users.length} users with tokens.`);

    // 2. Prepare Messages
    const messages = [];
    for (const user of users) {
      if (!Expo.isExpoPushToken(user.pushToken)) {
        console.warn(`⚠️ Invalid token for user ${user.username}: ${user.pushToken}`);
        continue;
      }

      messages.push({
        to: user.pushToken,
        ...NOTIFICATION_MESSAGE,
        data: { userId: user._id, username: user.username },
      });
    }

    console.log(`🚀 Sending ${messages.length} notifications...`);

    // 3. Send Notifications in Chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('✅ Sent chunk:', ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending chunk:', error);
      }
    }

    // 4. Check Receipts (Optional but recommended)
    console.log('Waiting 5s for receipts...');
    setTimeout(async () => {
      const receiptIds = tickets.filter((t) => t.id).map((t) => t.id);

      if (receiptIds.length > 0) {
        const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
        for (const chunk of receiptIdChunks) {
          try {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
            console.log('📬 Receipts:', JSON.stringify(receipts, null, 2));
          } catch (error) {
            console.error('❌ Error checking receipts:', error);
          }
        }
      }

      console.log('Done!');
      process.exit(0);
    }, 5000);
  } catch (error) {
    console.error('❌ Script Error:', error);
    process.exit(1);
  }
}

sendToAllUsers();
