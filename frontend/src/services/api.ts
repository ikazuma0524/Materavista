import axios from 'axios';
import { SimulationResponse, InputFileRequest, NLPromptRequest, InputFileResponse, ChatRequest, ChatResponse } from '@/types';

// Create axios instance for API calls
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const runLAMMPSSimulation = async (inputContent: string, potentialFileId?: string): Promise<SimulationResponse> => {
  try {
    const request: InputFileRequest = { 
      input_content: inputContent,
      potential_file_id: potentialFileId
    };
    const response = await api.post<SimulationResponse>('/api/simulate', request);
    return response.data;
  } catch (error) {
    console.error('Error running LAMMPS simulation:', error);
    if (axios.isAxiosError(error) && error.response) {
      return { error: error.response.data.error || 'Failed to run simulation' };
    }
    return { error: 'Failed to run simulation' };
  }
};

export const generateLAMMPSInput = async (prompt: string, potentialFileId?: string): Promise<InputFileResponse> => {
  try {
    const request: NLPromptRequest = { 
      prompt,
      potential_file_id: potentialFileId
    };
    const response = await api.post<InputFileResponse>('/api/generate', request);
    return response.data;
  } catch (error) {
    console.error('Error generating LAMMPS input:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to generate input');
    }
    throw new Error('Failed to generate input');
  }
};

export const getTrajectoryFile = async (fileId: string): Promise<string> => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // For server-side API calls
    if (typeof window === 'undefined') {
      const response = await axios.get(`${backendUrl}/trajectory/${fileId}`);
      return response.data;
    }
    
    // For client-side API calls
    const response = await api.get<string>(`/api/trajectory/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trajectory file:', error);
    throw new Error('Failed to fetch trajectory file');
  }
};

export const downloadTrajectoryFile = (fileId: string): void => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    console.error('Backend API URL is not configured');
    return;
  }
  
  // Create a link element and trigger download
  const link = document.createElement('a');
  link.href = `${backendUrl}/trajectory/${fileId}`;
  link.download = 'trajectory.xyz';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const healthCheck = async (): Promise<{ status: string }> => {
  try {
    // Use the backend health check endpoint directly
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured');
    }
    
    const response = await axios.get<{ status: string }>(`${backendUrl}/health`);
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw new Error('API healthcheck failed');
  }
};

export const chatWithAssistant = async (
  message: string, 
  conversationHistory: Array<{role: string, content: string}> = []
): Promise<ChatResponse> => {
  try {
    const request: ChatRequest = { 
      message, 
      conversation_history: conversationHistory 
    };
    const response = await api.post<ChatResponse>('/api/chat', request);
    return response.data;
  } catch (error) {
    console.error('Error chatting with assistant:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to chat with assistant');
    }
    throw new Error('Failed to chat with assistant');
  }
};

export const uploadPotentialFile = async (file: File): Promise<{ potential_file_id: string, filename: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // For client-side API calls
    const response = await api.post<{ potential_file_id: string, filename: string }>('/api/upload-potential', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading potential file:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to upload potential file');
    }
    throw new Error('Failed to upload potential file');
  }
}; 