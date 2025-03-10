// Simulation response from the backend
export interface SimulationResponse {
  msd?: number[];
  kinetic_energy?: number[];
  frames?: number;
  atoms?: number;
  error?: string;
  trajectory_file_id?: string;
}

// Request to run a simulation
export interface InputFileRequest {
  input_content: string;
  potential_file_id?: string;
}

// Request to generate an input file
export interface NLPromptRequest {
  prompt: string;
  potential_file_id?: string;
}

// Response from input file generation
export interface InputFileResponse {
  input_content: string;
  prompt: string;
}

// Chat request to the assistant
export interface ChatRequest {
  message: string;
  conversation_history?: Array<{role: string, content: string}>;
}

// Chat response from the assistant
export interface ChatResponse {
  response: string;
  conversation_history: Array<{role: string, content: string}>;
} 