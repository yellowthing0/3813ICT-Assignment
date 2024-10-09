# Chat Application

This project is a full-stack chat application built with **Node.js**, **Express**, **MongoDB** (Mongoose), **Socket.io**, and **Angular**. It supports real-time messaging, image and video uploads, and provides user authentication with JWT tokens.

## Features
- **Real-time Messaging**: Communicate instantly via text, with support for multiple groups and channels.
- **Image and Video Uploads**: Users can send images or video messages during chats.
- **Authentication**: JWT-based login with username and password.
- **Profile Management**: Users can upload and update their profile pictures.
- **User Roles**: Regular users and super admins with different capabilities.

## Prerequisites

To run this app, you will need the following installed:

1. **Node.js** (version 14 or higher)
2. **MongoDB** (ensure MongoDB is running on your local machine or a server)
3. **Angular CLI** (to run the frontend app)

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/chat-app.git
cd chat-app
```
2. Setup Backend (Server)
Navigate to the server directory:
```bash
cd server
```
##Install dependencies
npm install
Create .env file
Create a .env file at the root of the server folder and add your environment variables like JWT secret keys:

JWT_SECRET=your_secret_key
MONGO_URL=mongodb://localhost:27017/chatApp
Run MongoDB
Ensure that MongoDB is running. You can start it with the following command (if MongoDB is installed locally):
mongod
Start the server
Start the server by running:
```bash
npm start
````
This will start the server on http://localhost:3000.

3. Setup Frontend (Client)
Navigate to the frontend directory:
```bash
cd ../client
```
## Install dependencies
```bash
npm install
Run the Angular app
```
Start the Angular development server:
```bash
ng serve
```
This will start the frontend at http://localhost:4200.

4. Access the Application
Open your browser and navigate to http://localhost:4200.
The application will prompt you to log in with the predefined test users.
5. Predefined Test Users
Upon starting the server, three users will be created automatically:
```bash
Username: user / Password: user
Username: user2 / Password: user2
Username: super (Admin) / Password: super
These users can be used to log in and test the chat functionalities.

API Endpoints (Backend)
POST /api/login: Login with username and password, returns a JWT token.
GET /api/user/:username/profilePicture: Fetch the profile picture of a specific user (JWT Protected).
POST /api/updatePassword: Update the current user's password (JWT Protected).
POST /api/updateProfilePicture: Upload and update the user's profile picture (JWT Protected).
POST /api/upload: Upload images in the chat (JWT Protected).
GET /api/groups/:groupId/users: Fetch the users in a particular group (JWT Protected).
```
### Running Tests
Backend Tests (Mocha and Chai)
To run the tests for the backend, navigate to the server directory and run:
```bash
npm test
Frontend Tests (Karma and Jasmine)
To run the tests for the Angular frontend, navigate to the client directory and run:
ng test
```

### Directory Structure

Server (Backend)
```bash
server/
│
├── models/              # Mongoose models (User, Message)
├── routes/              # API routes
├── tests/               # Backend unit tests (Mocha, Chai)
├── server.js            # Entry point of the server
└── .env                 # Environment variables
```

Client (Frontend)
```bash
client/
│
├── src/
│   ├── app/
│   │   ├── components/     # Angular components (Channels, Groups, Login, Profile)
│   │   ├── services/       # Angular services (SocketService)
│   │   └── app.module.ts   # Main Angular module
├── angular.json            # Angular configuration file
└── karma.conf.js           # Karma configuration for unit tests
```
Technology Stack
Backend: Node.js, Express, MongoDB, Mongoose, JWT, Socket.io
Frontend: Angular, HTML5, CSS3, TypeScript
Testing: Mocha, Chai, Karma, Jasmine
