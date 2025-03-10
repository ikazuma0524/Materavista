import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `
            You are an expert in molecular dynamics simulations using LAMMPS (Large-scale Atomic/Molecular Massively Parallel Simulator).
            Your task is to generate a valid LAMMPS input file based on the user's prompt.
            Follow these guidelines:
            1. The input file should be valid LAMMPS syntax
            2. Include appropriate units, atom style, boundary conditions, etc.
            3. Set up the simulation system as described by the user
            4. Include appropriate potentials and force fields
            5. Make sure to include a 'dump' command that outputs to an XYZ file format for trajectory analysis
            6. Keep the simulation relatively short (around 1000-10000 steps) for testing purposes
            7. Only respond with the LAMMPS input file content without any other text or explanations
            `
          },
          {
            role: 'user',
            content: `Generate a LAMMPS input file for: ${prompt}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract the generated input file
    const generatedText = response.data.choices[0].message.content.trim();

    // Return the generated input file
    return res.status(200).json({ input_content: generatedText, prompt });
  } catch (error) {
    console.error('Error generating LAMMPS input:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({ 
        error: `OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}` 
      });
    }
    
    return res.status(500).json({ error: 'Failed to generate LAMMPS input' });
  }
} 