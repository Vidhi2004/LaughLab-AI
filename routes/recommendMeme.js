// const express = require("express");
// const ChatModel = require("../models/ChatModel");
// const spawn = require("child_process").spawn;
// const router = express.Router();
//
// router.get('/recommend-meme/:chatSessionId', async (req, res) => {
//     const { chatSessionId } = req.params;
//
//     try {
//         const chatSession = await ChatModel.findById(chatSessionId);
//         if (!chatSession) {
//             return res.status(404).json({ error: 'Chat session not found' });
//         }
//
//         // Extract the last message for context (if exists)
//         const lastMessage = chatSession.messages[chatSession.messages.length - 1]?.message || '';
//
//         // Mock meme recommendation logic
//         const recommendedMemes = [
//             { url: 'https://images.ctfassets.net/h6goo9gw1hh6/2BqWsp1aWAIxoe1qJ296KE/c5f2d77f8e0cdfac69e1ed59c91089d3/Yoda_meme.jpeg?w=503&h=499&fl=progressive&q=70&fm=jpg' },
//             { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKyXgCDfDJqQ3l-xnfdGdJ-0V4mRGD5wFcgOf-JLvN722euGRLeaNSBPabbU7ih2Ze4HY&usqp=CAU' },
//             { url: 'https://global.discourse-cdn.com/flex027/uploads/typesy/optimized/2X/c/c7c977a6a83853f8133658cf716a2afca01dd084_2_598x500.jpeg' },
//             { url: 'https://media.wired.com/photos/5941ec5b78ae4e10155a2e3b/master/pass/1EO06fVZUuTnGsv7oak1nPQ-1.jpeg' },
//             { url: 'https://www.lifewire.com/thmb/K0oF6bk8jsXRJFUFma5pNo7xjyc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Goalfor2020FunnyMeme-04eadff55a17489a85453238481fe36e.jpg' }
//         ];
//
//         // In future, integrate AI model with `lastMessage` to generate memes
//         res.json(recommendedMemes);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
//
// module.exports = router;
//
//
