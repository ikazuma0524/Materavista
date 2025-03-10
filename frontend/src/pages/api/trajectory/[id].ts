import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Trajectory ID is required' });
  }

  try {
    // Get the backend API URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend API URL is not configured' });
    }

    console.log(`Fetching trajectory file with ID: ${id}`);

    // Call the FastAPI backend to get the trajectory file
    const response = await axios.get(`${backendUrl}/trajectory/${id}`, {
      responseType: 'text',
      timeout: 30000 // 30 seconds timeout
    });

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=trajectory.xyz`);

    // Return the trajectory file content
    return res.status(200).send(response.data);
  } catch (error) {
    console.error('Error fetching trajectory file:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error) && error.response) {
      // Extract detailed error message if available
      const errorDetail = error.response.data.detail || error.response.data.error || 'Unknown error';
      return res.status(error.response.status).json({ 
        error: `Backend API error: ${errorDetail}` 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch trajectory file. Please try again later.' 
    });
  }
} 