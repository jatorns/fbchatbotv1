require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.get('/', (req, res) => {
  res.send('Webhook is live!');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

function handleMessage(sender_psid, received_message) {
  const response = {
    text: `You said: "${received_message.text}"`
  };

  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  request({
    uri: 'https://graph.facebook.com/v17.0/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:', err);
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
