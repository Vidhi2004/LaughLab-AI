const express = require('express');
const router = express.Router();
const { isAuthenticated, trackSession } = require('../middleware');
const User = require('../models/UserModel');
const ChatModel = require('../models/ChatModel');
const { analyzeMessage } = require("../services/geminiService");
const { fetchMemes } = require("../services/memeService");
const { rankMemes } = require("../services/rankingService");

router.use(trackSession);

router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.user;
        console.log(`Dashboard accessed by user: ${currentUser.username} (ID: ${currentUser._id})`);

        const chatSessions = await ChatModel.find({
            participants: currentUser._id
        }).populate('participants', 'username');

        console.log(`Found ${chatSessions.length} chat sessions for user ${currentUser.username}`);

        res.render('../views/index.ejs', { user: currentUser, chatSessions });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Error loading dashboard. Please try again.');
    }
});

router.post('/create-chat', isAuthenticated, async (req, res) => {
    try {
        const { username } = req.body;
        const currentUser = req.user;

        // Validate input
        if (!username || username.trim() === '') {
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        // Check if user is trying to chat with themselves
        if (username.trim() === currentUser.username) {
            return res.status(400).json({ success: false, message: "You cannot create a chat with yourself." });
        }

        // Find the target user
        const targetUser = await User.findOne({ username: username.trim() });
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found. Please check the username and try again.' });
        }

        // Check if a chat session already exists between these users
        const existingChat = await ChatModel.findOne({
            participants: { $all: [currentUser._id, targetUser._id] }
        });

        if (existingChat) {
            // Chat already exists, redirect to existing chat
            console.log(`Redirecting to existing chat: ${existingChat._id}`);
            return res.redirect(`/chat/${existingChat._id}`);
        }

        // Create new chat session
        const chatSession = new ChatModel({
            participants: [currentUser._id, targetUser._id],
            messages: []
        });

        await chatSession.save();
        console.log(`New chat created: ${chatSession._id} between ${currentUser.username} and ${targetUser.username}`);

        res.redirect(`/chat/${chatSession._id}`);
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ success: false, message: 'An error occurred while creating the chat. Please try again.' });
    }
});

router.get('/chat/:chatSessionId', isAuthenticated, async (req, res) => {
    const { chatSessionId } = req.params;
    const chatSession = await ChatModel.findById(chatSessionId).populate('participants');

    if (!chatSession) {
        return res.status(404).send('Chat session not found.');
    }

    if (!chatSession.participants.some(user => user._id.toString() === req.user._id.toString())) {
        return res.status(403).send('You are not authorized to view this chat.');
    }

    // Ensure 'user' is passed to the template
    res.render('chat', {
        chatSession,
        user: req.user // Always pass the 'user' object
    });
});

router.post('/send-message/:chatSessionId', isAuthenticated, async (req, res) => {
    const { chatSessionId } = req.params;
    const { message, messageType = 'text' } = req.body; // Default to text messages
    const currentUser = req.user;

    try {
        const chatSession = await ChatModel.findById(chatSessionId).populate('participants');
        if (!chatSession) {
            return res.status(404).send('Chat session not found.');
        }

        if (!chatSession.participants.some(user => user._id.toString() === currentUser._id.toString())) {
            return res.status(403).send('You are not authorized to send a message in this chat.');
        }

        const newMessage = {
            senderId: currentUser._id,
            receiverId: chatSession.participants.find(user => user._id.toString() !== currentUser._id.toString())._id,
            message: messageType === 'text' ? message : undefined,
            mediaUrl: messageType === 'meme' ? message : undefined, // Store meme URL if messageType is 'meme'
            messageType: messageType, // Store the type of the message
        };

        // Push the new message to the chat session's messages array
        chatSession.messages.push(newMessage);

        // Save the updated chat session
        await chatSession.save();

        // Check if this is an AJAX request
        const isAjaxRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('json')) ||
            (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

        if (isAjaxRequest) {
            // For AJAX requests, respond with JSON
            return res.status(200).json({
                success: true,
                message: 'Message sent successfully.',
                chatSession
            });
        } else {
            // For regular form submissions, redirect back to the chat page
            return res.redirect(`/chat/${chatSessionId}`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Handle error based on request type
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json')) ||
            (req.headers['content-type'] && req.headers['content-type'].includes('application/json'))) {
            return res.status(500).json({ success: false, error: 'Error sending message.' });
        } else {
            return res.status(500).send('Error sending message.');
        }
    }
});

router.post('/recommend-meme/:chatSessionId', async (req, res) => {

    const { chatSessionId } = req.params;
    const { currentMessage } = req.body;

    if (!currentMessage || currentMessage.trim() === "") {
        return res.status(400).json({
            error: "Message cannot be empty."
        });
    }

    console.log("Chat Session:", chatSessionId);
    console.log("User Message:", currentMessage);

    try {
        if (!chatSessionId) {
            return res.status(400).json({
                error: "Invalid Chat Session."
            });
        }
        // Check chat exists
        const chatSession = await ChatModel.findById(chatSessionId);

        if (!chatSession) {
            return res.status(404).json({
                error: "Chat session not found"
            });
        }

        // Analyze message using Gemini
        const analysis = await analyzeMessage(currentMessage);

        console.log("Gemini Analysis:", analysis);

        // Fetch latest memes
        console.log("Fetching memes...");

        const memes = await fetchMemes();

        console.log("Total memes fetched:", memes.length);

        console.log("First meme:", memes[0]);
        // Rank memes
        const topMemes = rankMemes(
            memes,
            analysis.keywords
        );
        console.log("Top Memes:");

        console.log(topMemes);

        // Return response
        return res.status(200).json({

            emotion: analysis.emotion,

            keywords: analysis.keywords,

            memeUrls: topMemes
                .filter(meme => meme.url)
                .map(meme => meme.url)
        });

    } catch (err) {

        console.log("=================================");
        console.log("FULL ERROR");
        console.log(err);
        console.log("=================================");

        return res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

module.exports = router;
