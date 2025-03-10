import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ChatRequest, ChatResponse } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatRequest = req.body as ChatRequest;
    
    // Validate request
    if (!chatRequest.message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get backend API URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend API URL is not configured' });
    }

    // Call backend API
    const response = await axios.post<ChatResponse>(
      `${backendUrl}/chat/`,
      chatRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    // Return the response
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      return res.status(statusCode).json({ error: errorMessage });
    }
    
    // Handle other errors
    return res.status(500).json({ error: 'Failed to chat with assistant' });
  }
} 