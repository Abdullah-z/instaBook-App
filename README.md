# InstaBook - MERN Stack Social Media App with Mobile & Web Clients

InstaBook is a comprehensive social media application built using the MERN stack (MongoDB, Express, React, Node.js). It features a robust web client and a fully functional mobile application built with React Native (Expo). The app supports real-time messaging, voice calls, post sharing, notifications, and more.

## 🚀 Features

### 📱 Mobile App (React Native / Expo)

- **Authentication**: Secure Login and Registration screens.
- **Social Feed**: Scroll through posts from users you follow.
- **Post Management**: Create, Edit, Delete, and View detailed posts with comments.
- **User Profiles**:
  - View user details, avatars, and cover photos.
  - Browse user albums and posts.
  - Follow/Unfollow users.
- **Real-time Messaging**:
  - One-on-one chat with real-time updates using Socket.io.
  - Image sharing in chats.
  - Indicator for online users.
- **Voice Calling**:
  - High-quality voice calls powered by **Agora**.
  - Incoming call notifications with ringtone.
  - In-call UI showing user avatars and duration.
  - Support for microphone and speaker toggling.
- **Notifications**: Real-time push notifications for likes, comments, and follows.
- **Discovery**: Search for users and discover new content.
- **Weather**: Integrated weather news screen.
- **Admin Dashboard**: Visual analytics and user management tables.

### 💻 Web Client (React)

- **Responsive Design**: Full-featured web interface mirroring mobile capabilities.
- **Feed & Posts**: Interactive home feed with infinite scroll.
- **Rich Media**: Upload and view images in posts and messages.
- **Chat Interface**: Desktop-optimized messaging experience.
- **Dark/Light Mode**: (In progress/referenced in development).

### 🛠 Backend (Node.js & Express)

- **REST API**: robust API architecture handling all platform data.
- **Real-time Engine**: Socket.io integration for instant messaging and notifications.
- **Database**: MongoDB with Mongoose for data modeling (Users, Posts, Comments, Notifications).
- **Media Storage**: Cloudinary integration for image uploads.
- **Voice Token Server**: Backend logic to generate Agora tokens for secure calls.
- **Security**: JWT-based authentication and authorization.

## 🏗 Tech Stack

### Frontend (Mobile)

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Real-time**: Socket.io-client
- **Voice/Video**: React Native Agora, Expo AV
- **UI/Icons**: Material Icons, Ionicons

### Frontend (Web)

- **Library**: React.js
- **State Management**: Redux
- **Styling**: Custom CSS / Styled Components
- **HTTP Client**: Axios

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: JSON Web Token (JWT)

## 📂 Project Structure

```
/
├── app/          # Mobile Application (React Native/Expo)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── screens/     # Application screens (Home, Chat, Profile, etc.)
│   │   ├── navigation/  # Navigation configuration
│   │   ├── auth/        # Contexts (Auth, Socket, VoiceCall)
│   │   └── api/         # API service calls
│   └── ...
│
├── client/            # Web Frontend (React)
│   ├── src/
│   │   ├── components/  # Web components
│   │   ├── pages/       # Web pages
│   │   ├── redux/       # State management
│   │   └── ...
│   └── ...
│
└── server/            # Backend API
    ├── controllers/   # Request handlers (Auth, Post, Chat, Agora, etc.)
    ├── models/        # Mongoose data models
    ├── routes/        # API route definitions
    └── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- MongoDB installed and running (or a cloud URL)
- Expo Go app on your mobile device (for mobile testing)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/instabook.git
    cd instabook
    ```

2.  **Setup Backend**

    ```bash
    cd server
    npm install
    # Create a .env file with your credentials (MONGO_URL, JWT_SECRET, CLOUDINARY_*, AGORA_APP_ID, etc.)
    npm start
    ```

3.  **Setup Web Client**

    ```bash
    cd client
    npm install
    npm start
    ```

4.  **Setup Mobile App**
    ```bash
    cd facebook
    npm install
    npx expo start
    # Scan the QR code with Expo Go
    ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

[MIT](LICENSE)
