// models/chatModel.js

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        default: () => uuidv4(),  // Generate a unique ID for each message
        unique: false,  // Remove uniqueness constraint to prevent index issues
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    message: {
        type: String,
        required: function () {
            return this.messageType === 'text';
        },
    },
    mediaUrl: {
        type: String,
        required: function () {
            return this.messageType === 'image' || this.messageType === 'meme';
        },
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'meme'],
        default: 'text',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    readStatus: {
        type: Boolean,
        default: false,
    },
});


const chatSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    messages: [messageSchema],
    lastMessage: {
        type: String,
        default: '',
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    memeRecommendation: {
        type: Boolean,
        default: false,
    },
});

chatSchema.pre('save', function (next) {
    if (this.messages && this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        this.lastMessage = lastMsg.messageType === 'text' ? lastMsg.message : `Sent a ${lastMsg.messageType}`;
        this.lastUpdated = Date.now();
    }
    next();
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
