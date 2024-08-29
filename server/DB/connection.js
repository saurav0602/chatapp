const mongoose = require('mongoose');

const url = `mongodb+srv://chat-app-admin:Saurav123@cluster0.brjqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(url, {
    useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e)=> console.log('Error', e))