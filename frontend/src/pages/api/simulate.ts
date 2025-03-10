import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input_content, potential_file_id } = req.body;

    if (!input_content || typeof input_content !== 'string') {
      return res.status(400).json({ error: 'Input content is required and must be a string' });
    }

    // Validate input content for common issues
    if (input_content.includes('read_data') && !input_content.includes('# read_data')) {
      return res.status(400).json({ 
        error: 'Your input file references external data files with read_data command. This may cause errors as the referenced files are not available.' 
      });
    }

    // Get the backend API URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend API URL is not configured' });
    }

    console.log(`Calling backend API at ${backendUrl}/run-lammps/`);

    // Prepare request body
    const requestBody: { input_content: string; potential_file_id?: string } = { input_content };
    
    // Add potential_file_id if provided
    if (potential_file_id) {
      requestBody.potential_file_id = potential_file_id;
    }

    // Call the FastAPI backend to run the simulation with increased timeout
    const response = await axios.post(
      `${backendUrl}/run-lammps/`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 600000 // 10 minutes timeout (increased from 5 minutes)
      }
    );

    // Return the simulation results
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error running LAMMPS simulation:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error) && error.response) {
      // Extract detailed error message if available
      const errorDetail = error.response.data.detail || error.response.data.error || 'Unknown error';
      return res.status(error.response.status).json({ 
        error: `Backend API error: ${errorDetail}` 
      });
    }
    
    // Handle timeout errors specifically
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'Simulation timed out. The operation took too long to complete. Try reducing the number of timesteps or simplifying your simulation.' 
      });
    }

    // Handle connection errors
    if (axios.isAxiosError(error) && error.code === 'ECONNRESET') {
      return res.status(503).json({ 
        error: 'Connection was reset. The backend service might be unavailable or the simulation might be too complex. Try simplifying your simulation parameters.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to run LAMMPS simulation. Please check your input file for errors and try again.' 
    });
  }
} 