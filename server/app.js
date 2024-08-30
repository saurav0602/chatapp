const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config(); // Make sure to include this to load the .env file

// Database connection
require('./DB/connection');

const Users = require('./models/Users');
const Conversations = require('./models/Conversations');
const Messages = require('./models/Messages');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URI,
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Socket.io connection
let users = [];
io.on('connection', socket => {
    console.log('User connected', socket.id);

    socket.on('addUser', userId => {
        const isUserExist = users.find(user => user.userId === userId);
        if (!isUserExist) {
            users.push({ userId, socketId: socket.id });
            io.emit('getUsers', users);
        }
    });

    socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
        try {
            const receiver = users.find(user => user.userId === receiverId);
            const sender = users.find(user => user.userId === senderId);
            const user = await Users.findById(senderId).exec();
            if (receiver) {
                io.to(receiver.socketId).to(sender.socketId).emit('getMessage', {
                    senderId,
                    message,
                    conversationId,
                    receiverId,
                    user: { id: user._id, fullName: user.fullName, email: user.email }
                });
            } else {
                io.to(sender.socketId).emit('getMessage', {
                    senderId,
                    message,
                    conversationId,
                    receiverId,
                    user: { id: user._id, fullName: user.fullName, email: user.email }
                });
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);
        }
    });

    socket.on('disconnect', () => {
        users = users.filter(user => user.socketId !== socket.id);
        io.emit('getUsers', users);
    });
});

// Routes
app.get('/', (req, res) => {
    res.send('Hi, welcome');
});

app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).send('Please fill all required fields');
        }
        const isAlreadyExist = await Users.findOne({ email }).exec();
        if (isAlreadyExist) {
            return res.status(400).send('User already exists');
        }
        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = new Users({ fullName, email, password: hashedPassword });
        await newUser.save();
        res.status(200).send('User registered successfully');
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).send('Server error');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Please fill all required fields');
        }
        const user = await Users.findOne({ email }).exec();
        if (!user || !(await bcryptjs.compare(password, user.password))) {
            return res.status(400).send('User email or password is incorrect');
        }
        const payload = { userId: user._id, email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
        await Users.updateOne({ _id: user._id }, { $set: { token } }).exec();
        res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName }, token });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).send('Server error');
    }
});

app.post('/api/conversation', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const newConversation = new Conversations({ members: [senderId, receiverId] });
        await newConversation.save();
        res.status(200).send('Conversation created successfully');
    } catch (error) {
        console.error('Error in createConversation:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const conversations = await Conversations.find({ members: { $in: [userId] } }).exec();
        const conversationUserData = await Promise.all(conversations.map(async (conversation) => {
            const receiverId = conversation.members.find(member => member !== userId);
            const user = await Users.findById(receiverId).exec();
            return { user: { receiverId: user._id, email: user.email, fullName: user.fullName }, conversationId: conversation._id };
        }));
        res.status(200).json(conversationUserData);
    } catch (error) {
        console.error('Error in getConversations:', error);
        res.status(500).send('Server error');
    }
});

app.post('/api/message', async (req, res) => {
    try {
        const { conversationId, senderId, message, receiverId = '' } = req.body;
        if (!senderId || !message) return res.status(400).send('Please fill all required fields');
        if (conversationId === 'new' && receiverId) {
            const newConversation = new Conversations({ members: [senderId, receiverId] });
            await newConversation.save();
            conversationId = newConversation._id;
        }
        const newMessage = new Messages({ conversationId, senderId, message });
        await newMessage.save();
        res.status(200).send('Message sent successfully');
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/message/:conversationId', async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = await Messages.find({ conversationId }).exec();
        const messageUserData = await Promise.all(messages.map(async (message) => {
            const user = await Users.findById(message.senderId).exec();
            return { user: { id: user._id, email: user.email, fullName: user.fullName }, message: message.message };
        }));
        res.status(200).json(messageUserData);
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const users = await Users.find({ _id: { $ne: userId } }).exec();
        const usersData = users.map(user => ({
            user: { email: user.email, fullName: user.fullName, receiverId: user._id }
        }));
        res.status(200).json(usersData);
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).send('Server error');
    }
});

// Start server
const port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
