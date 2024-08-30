const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://chat-app-admin:Saurav123@cluster0.brjqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';



mongoose.connect(mongoUri, {
    // useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e)=> console.log('Error', e))