import dotenv from 'dotenv';
dotenv.config();

// const GROQ_API_KEY = process.env.GROQ_API_KEY; // Get API key from environment variable

export async function generateGroqResponse(prompt) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {  // Changed URL to include 'openai'
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('Full error response:', error); // Add this for debugging
      throw new Error(`Groq API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response from Groq.";
  } catch (err) {
    console.error("Groq error:", err.message);
    return "Sorry, I encountered an error while processing your request.";
  }
}
