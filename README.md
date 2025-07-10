 🕷️ Telegram Crawler Bot

A Telegram bot that monitors messages in a Telegram channel, detects any posted web links, scrapes their content using Crawl4AI, and summarizes the content using the GROQ LLM API — all in real-time.

---

 📌 Overview

This project simplifies content discovery and understanding directly from your Telegram channel. When a user posts a URL:

1. The bot captures the message
2. Scrapes and extracts key content from the link using Crawl4AI
3. Uses GROQ API to summarize the extracted content
4. Replies with the summary in the same channel

---
 🧠 Features

- 🔎 Detects links from messages in a Telegram channel
- 🕸️ Uses Crawl4AI to extract article content from webpages
- 🧠 Summarizes content with GROQ LLM API
- 💬 Responds directly inside the Telegram channel
- ⚙️ Fully configurable via environment variables

---

 🧰 Tech Stack

| Tool/Library        | Purpose                               |
|---------------------|---------------------------------------|
| Python          | Core programming language                |
| Crawl4AI        | Web scraping and content extraction      |
| Telegram API    | Messaging and bot communication          |
| GROQ API        | LLM-powered content summarization        |
| python-dotenv   | Secure environment variable handling     |

---

 🗂️ Folder Structure
 telegram-crawler-bot/

├── crawler.py # Content extraction using Crawl4AI
├── groq_api.py # GROQ summarization handler

├── .env # Secrets and configuration variables
├── requirements.txt # Python dependencies

