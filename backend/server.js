// server.js
require('dotenv').config();
const WebSocket = require('ws');
const express = require('express');
const Twitter = require('twitter');

// Initialize Twitter client
const twitterClient = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET
});

const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

const server = app.listen(PORT, () => 
  console.log(`Server running on port ${PORT}`));

const wss = new WebSocket.Server({ server });

// Mock sentiment analysis
function analyzeSentiment(text) {
  return {
    positive: Math.random() * 100,
    neutral: Math.random() * 100,
    negative: Math.random() * 100
  };
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Twitter stream
  const stream = twitterClient.stream('statuses/filter', {
    track: ['RealMadrid', 'Barcelona', 'UCL']
  });

  stream.on('data', (tweet) => {
    if (tweet.text) {
      const sentiment = analyzeSentiment(tweet.text);
      ws.send(JSON.stringify({
        type: 'sentiment',
        data: {
          timestamp: new Date().toISOString(),
          ...sentiment
        }
      }));
    }
  });

  // Simulated match events
  const events = [
    {
      time: '19:45',
      title: 'Goal: Real Madrid 1-0',
      description: 'Positive spike among Real Madrid fans',
      hashtags: ['#RMLeading']
    },
    {
      time: '20:15',
      title: 'Controversial Penalty',
      description: 'Negative sentiment across regions',
      hashtags: ['#VARFail']
    }
  ];

  events.forEach((event, index) => {
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'event',
        data: event
      }));
    }, (index + 1) * 5000); // Send events every 5 seconds
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    stream.destroy();
  });
});