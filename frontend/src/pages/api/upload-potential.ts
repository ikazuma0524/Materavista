import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the backend API URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend API URL is not configured' });
    }

    // Parse the form data
    const form = formidable({ multiples: false });
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Get the file
    const file = files.file;
    if (!file || Array.isArray(file)) {
      return res.status(400).json({ error: 'No file uploaded or multiple files detected' });
    }

    // Read the file
    const fileData = fs.readFileSync(file.filepath);
    
    // Create form data for the backend request
    const formData = new FormData();
    const blob = new Blob([fileData], { type: file.mimetype || 'application/octet-stream' });
    formData.append('file', blob, file.originalFilename || 'potential_file');

    console.log(`Uploading potential file to ${backendUrl}/upload-potential/`);

    // Call the FastAPI backend to upload the file
    const response = await axios.post(
      `${backendUrl}/upload-potential/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Return the response from the backend
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error uploading potential file:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error) && error.response) {
      // Extract detailed error message if available
      const errorDetail = error.response.data.detail || error.response.data.error || 'Unknown error';
      return res.status(error.response.status).json({ 
        error: `Backend API error: ${errorDetail}` 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to upload potential file. Please try again.' 
    });
  }
} 