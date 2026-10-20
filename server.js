const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// --- MGA CREDENTIALS ---
const PAGE_ACCESS_TOKEN = 'EAAXmY5MsuqABS9CMQ1k1mZCpEbhVdKWSPYscPiGKvJyt7f6kjn4na0eo4BHFxfkxzjoZCNNrDuQZCGivibEnw1Rg1R5bHzAccWaTCGgDmbgbyBVlgitSUGYdpcZBZCtMnSYUXYF11nLD049M18JhjyReYNfufH6L3dSl0p2qO7C7ARa77k88z9EQGlHA0A5zYLBGLxQbZB0Q3aAfurByJJ3rZC7UygZDZD';
const GROQ_API_KEY = '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'; // I-paste diri ang gsk_...
const VERIFY_TOKEN = 'ALCATECH_SECRET_KEY_123';

// 1. Webhook Verification (Auto-Approve para sa Meta)
app.get('/webhook', (req, res) => {
    const challenge = req.query['hub.challenge'];
    console.log('✅ WEBHOOK_VERIFIED gikan sa Meta!');
    if (challenge) {
        res.status(200).send(challenge);
    } else {
        res.status(200).send('ALCA Tech AI Server is Online');
    }
});

// 2. Pagdawat sa Chat gikan sa Messenger
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderPsid = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                const userMsg = webhookEvent.message.text;
                console.log(`📩 Customer: ${userMsg}`);

                try {
                    // Tawgon ang Groq Cloud AI (Llama 3)
                    const groqResponse = await axios.post(
                        'https://api.groq.com/openai/v1/chat/completions',
                        {
                            model: 'llama-3.1-8b-instant',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are the helpful, polite, and professional AI Assistant of ALCA TECH DAVAO. We specialize in CCTV installation (2-cam, 3-cam, 4-cam packages), wireless SD card cameras, and free site surveys/quotations in Davao City. Keep responses concise, friendly, and in natural Tagalog/Bisaya/English as appropriate.'
                                },
                                { role: 'user', content: userMsg }
                            ]
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${GROQ_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    const aiReply = groqResponse.data.choices[0].message.content;
                    console.log(`🤖 AI: ${aiReply}`);

                    // Ipadala ang tubag balik sa Messenger
                    await axios.post(
                        `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                        {
                            recipient: { id: senderPsid },
                            message: { text: aiReply }
                        }
                    );
                } catch (error) {
                    console.error('❌ Error sa AI/Messenger:', error.response ? error.response.data : error.message);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ALCA Tech Cloud AI Server nagdagan sa port ${PORT}`);
});