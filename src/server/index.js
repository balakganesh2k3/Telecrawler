import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

import { CustomCrawler } from './crawler.js';
import { generateGroqResponse } from './groq.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const crawler = new CustomCrawler();
const activeSessions = new Map();

// 🧠 /chat endpoint for frontend
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await generateGroqResponse(userMessage);
    res.json({ reply });
  } catch (error) {
    console.error('Error in /chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🧠 Format crawler results
function formatCrawlerResults(content) {
  let message = `📄 ${content.title}\n\n`;

  if (content.description) {
    message += `📝 ${content.description}\n\n`;
  }

  message += `🔗 ${content.url}\n\n`;

  message += `📚 Content Summary:\n${content.textContent.substring(0, 2000)}...\n\n`;

  if (content.images.length > 0) {
    message += `🖼 Found ${content.images.length} images\n`;
    content.images.slice(0, 3).forEach(img => {
      message += `- ${img.alt || 'Untitled image'}\n`;
    });
    message += '\n';
  }

  if (content.links.length > 0) {
    message += `🔗 Found ${content.links.length} links\n`;
    content.links.slice(0, 3).forEach(link => {
      message += `- ${link.text || link.href}\n`;
    });
  }

  return message;
}

// 📩 Telegram message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  try {
    await supabase.from('messages').insert({
      platform: 'telegram',
      user_id: chatId.toString(),
      message: text,
      direction: 'incoming',
      timestamp: new Date()
    });

    io.emit('telegram:message', { chatId, text, timestamp: new Date() });

    if (!activeSessions.has(chatId)) {
      activeSessions.set(chatId, { lastActive: new Date(), messageCount: 0 });
    }

    const session = activeSessions.get(chatId);
    session.lastActive = new Date();
    session.messageCount++;

    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(text)) {
      await bot.sendMessage(chatId, '🔍 Crawling webpage, please wait...');

      try {
        const content = await crawler.fetchPage(text);
        const formatted = formatCrawlerResults(content);
        await bot.sendMessage(chatId, formatted);
      } catch (error) {
        await bot.sendMessage(chatId, `❌ Could not crawl page: ${error.message}`);
      }
    } else {
      const aiReply = await generateGroqResponse(text);
      await bot.sendMessage(chatId, aiReply);

      await supabase.from('messages').insert({
        platform: 'telegram',
        user_id: chatId.toString(),
        message: aiReply,
        direction: 'outgoing',
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error('Error in Telegram bot handler:', error);
    await bot.sendMessage(chatId, '❌ Error processing your message.');
  }
});

// 💬 Socket.IO handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('bot:response', async ({ chatId, text }) => {
    try {
      await bot.sendMessage(chatId, text);
      await supabase.from('messages').insert({
        platform: 'telegram',
        user_id: chatId.toString(),
        message: text,
        direction: 'outgoing',
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Socket bot response error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
