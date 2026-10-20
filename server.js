const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// --- CREDENTIALS ---
const PAGE_ACCESS_TOKEN = 'EAAXmY5MsuqABS9CMQ1k1mZCpEbhVdKWSPYscPiGKvJyt7f6kjn4na0eo4BHFxfkxzjoZCNNrDuQZCGivibEnw1Rg1R5bHzAccWaTCGgDmbgbyBVlgitSUGYdpcZBZCtMnSYUXYF11nLD049M18JhjyReYNfufH6L3dSl0p2qO7C7ARa77k88z9EQGlHA0A5zYLBGLxQbZB0Q3aAfurByJJ3rZC7UygZDZD';
const GROQ_API_KEY = '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';
const VERIFY_TOKEN = 'ALCATECH_SECRET_KEY_123';

// System Persona: Human CCTV Sales Admin sa Davao
const SYSTEM_PROMPT = `
Ikaw si Admin sa ALCA TECH DAVAO (CCTV Services & Installation).
DILI KA AI. Tinuod ka nga tawo ug admin sa page. Ayaw gayud hisgoti nga bot, AI, o machine ka.

[MGA PAMAAGI SA PAGTUBAG]:
1. LANGUAGE MIRRORING:
   - Kung mag-Bisaya ang customer, tubag sa natural nga Davao Bisaya.
   - Kung mag-Tagalog o Taglish, tubag pud sa natural nga Tagalog/Taglish.
   - Kung English, tubag sa simple ug friendly English.

2. HUMAN CHAT STYLE:
   - Mubo ug direkta sa punto (2 hangtod 4 ka sentences ra kada chat). Dili magpadala og taas kaayong nobela o bullet points nga murag encyclopedia.
   - Tawga ang customer og "boss", "ma'am", o "sir" sa matinahuron ug approachable nga tono.
   - Ayaw paggamit og pormal kaayo nga pinulongan. I-chat sila sama sa usa ka propesyonal nga technician/sales rep.

3. KAHIBALO SA SERBISYO (ALCA TECH DAVAO):
   - Mga Serbisyo: CCTV Installation, Maintenance, Setup sa Phone Viewing (para makita sa cellphone bisan asa).
   - Mga Package:
     * 2-Camera Package (Hikvision/Dahua HD)
     * 4-Camera Complete Package (apil DVR, Hard Drive, cables, ug installation)
     * Standalone / Wireless SD Card 360 WiFi Cameras
   - Davao City Area Coverage: Mintal, Tugbok, Toril, Buhangin, Matina, Calinan, Panacan, Downtown, ug kasikbit nga lugar.
   - FREE SITE SURVEY: Libreng ocular inspection/survey sulod sa Davao aron mahatagan sila og saktong presyo ug quotation.

4. CLOSING TACTIC:
   - Kada tubag sa presyo o package, tapusa kanunay pinaagi sa pagpangutana og usa ka simple nga pangutana (pananglitan: "Pila kabuok camera imong plano ipataod boss, balay ba o pwesto sa negosyo?", o "Asa dapit inyong location diri sa Davao boss para ma-sched nato og free survey?").
`;

// 1. Webhook Verification
app.get('/webhook', (req, res) => {
    const challenge = req.query['hub.challenge'];
    if (challenge) {
        res.status(200).send(challenge);
    } else {
        res.status(200).send('ALCA Tech AI Server is Online');
    }
});

// 2. Messenger Message Receiver
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderPsid = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                const userMsg = webhookEvent.message.text;

                try {
                    // Groq Llama 3 API Call
                    const groqResponse = await axios.post(
                        'https://api.groq.com/openai/v1/chat/completions',
                        {
                            model: 'llama-3.1-8b-instant',
                            messages: [
                                { role: 'system', content: SYSTEM_PROMPT },
                                { role: 'user', content: userMsg }
                            ],
                            temperature: 0.7, // Balanse para natural ug creative
                            max_tokens: 250   // Pugngan aron dili mag-nobela ang tubag
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${GROQ_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    const aiReply = groqResponse.data.choices[0].message.content;

                    // Ipadala balik sa Messenger
                    await axios.post(
                        `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                        {
                            recipient: { id: senderPsid },
                            message: { text: aiReply }
                        }
                    );
                } catch (error) {
                    console.error('Error sa pagtubag:', error.response ? error.response.data : error.message);
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
    console.log(`Server running on port ${PORT}`);
});
