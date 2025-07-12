import { OpenAI } from 'openai';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // Store user message
  const userMsg = await prisma.message.create({
    data: {
      sender: 'user',
      text: message,
    },
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: 'You are a helpful assistant connected to Gmail, Calendar, and HubSpot.' },
        { role: 'user', content: message },
      ],
      functions: [
        // Define your tools (calendar, Gmail, HubSpot, etc.)
        {
          name: 'create_calendar_event',
          description: 'Create a calendar event',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              date: { type: 'string' },
            },
            required: ['title', 'date'],
          },
        },
        // Add more tools here
      ],
      function_call: 'auto',
    });

    const reply = response.choices[0];

    // Save AI reply
    const agentMsg = await prisma.message.create({
      data: {
        sender: 'agent',
        text: reply.message.content || '[Agent response with function call]',
      },
    });

    res.status(200).json({ reply: agentMsg.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
