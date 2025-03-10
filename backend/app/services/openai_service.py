import os
import logging
import json
import requests
from typing import Dict, Any, Optional, List

class OpenAIService:
    """Service for generating LAMMPS input files using OpenAI."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the OpenAI service.
        
        Args:
            api_key (str, optional): The OpenAI API key. If not provided, will use OPENAI_API_KEY env var.
        """
        self.logger = logging.getLogger(__name__)
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            self.logger.warning("OpenAI API key not provided. Service may not work correctly.")
    
    def generate_lammps_input(self, prompt: str) -> str:
        """
        Generate a LAMMPS input file from a natural language prompt.
        
        Args:
            prompt (str): The user's natural language prompt.
            
        Returns:
            str: The generated LAMMPS input file content.
            
        Raises:
            Exception: If the API call fails or no API key is provided.
        """
        if not self.api_key:
            raise ValueError("OpenAI API key is required but not provided.")
        
        try:
            # Define the system message
            system_message = """You are a scientific computing assistant specialized in molecular dynamics simulations with LAMMPS.
Your task is to generate a valid LAMMPS input file based on the user's request.

Guidelines:
1. Write the input file in valid LAMMPS syntax.
2. Specify essential simulation parameters including:
   - 'units' (e.g., lj, metal, real, etc.),
   - 'atom_style' (e.g., atomic, charge, etc.),
   - 'boundary' conditions (e.g., p p p for periodic boundaries).
3. Define the simulation box (using the 'region' command) and create atoms (using 'create_box' and 'create_atoms').
4. **Explicitly set masses for all atom types** with the 'mass' command.
5. Specify interatomic interactions with commands such as 'pair_style' and 'pair_coeff'.
6. Set initial velocities using the 'velocity' command (ensure masses are set prior).
7. Include TWO dump commands:
   - One that outputs trajectory data in XYZ file format (positions)
   - Another that outputs velocity data in a custom format including atom ID, type, vx, vy, vz
   Example:
   ```
   dump 1 all xyz 100 dump.xyz
   dump 2 all custom 100 dump.vel id type vx vy vz
   ```
8. Configure a simulation run with an appropriate 'run' command (suggest between 1000 and 10000 steps).
9. Do not include any extra explanations or commentary—output only the raw LAMMPS input file content.
10. If the user provides a potential file content, incorporate the parameters directly into the input file rather than using include or read_data commands.
"""

            # Make the API call
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": f"Generate a LAMMPS input file for: {prompt}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 2000
                }
            )
            
            # Check for errors
            response.raise_for_status()
            
            # Parse the response
            response_data = response.json()
            
            if "choices" not in response_data or len(response_data["choices"]) == 0:
                raise ValueError("Unexpected response format from OpenAI API")
            
            # Extract the generated input file
            generated_text = response_data["choices"][0]["message"]["content"].strip()
            
            return generated_text
            
        except requests.RequestException as e:
            self.logger.error(f"Error calling OpenAI API: {str(e)}")
            raise Exception(f"Failed to generate LAMMPS input: {str(e)}")
        except Exception as e:
            self.logger.error(f"Error in generate_lammps_input: {str(e)}")
            raise Exception(f"Failed to generate LAMMPS input: {str(e)}")

    def _is_valid_lammps_input(self, input_content: str) -> bool:
        """
        Perform basic validation of a LAMMPS input file.
        
        Args:
            input_content (str): The content to validate.
            
        Returns:
            bool: True if the content appears to be valid LAMMPS input, False otherwise.
        """
        # Check for some basic LAMMPS commands that should be present
        required_keywords = ["units", "atom_style", "run", "mass"]
        
        for keyword in required_keywords:
            if keyword not in input_content.lower():
                return False
        
        # Check that it has a dump command for output
        if "dump" not in input_content.lower():
            return False
        
        return True
        
    def chat_with_assistant(self, conversation_history: List[Dict[str, str]]) -> str:
        """
        Chat with a LAMMPS simulation assistant.
        
        Args:
            conversation_history (List[Dict[str, str]]): The conversation history.
            
        Returns:
            str: The assistant's response.
            
        Raises:
            Exception: If the API call fails or no API key is provided.
        """
        if not self.api_key:
            raise ValueError("OpenAI API key is required but not provided.")
        
        try:
            # System message for LAMMPS assistant
            system_message = """
You are a helpful assistant specializing in molecular dynamics simulations with LAMMPS (Large-scale Atomic/Molecular Massively Parallel Simulator).
Your role is to help users set up and understand LAMMPS simulations. You can:

1. Explain LAMMPS commands and their parameters
2. Suggest appropriate simulation settings for different materials and conditions
3. Help troubleshoot common simulation issues
4. Recommend best practices for molecular dynamics simulations
5. Explain scientific concepts related to molecular dynamics

When discussing simulation parameters, be specific about:
- Appropriate units (real, metal, lj, etc.) for different types of simulations
- Suitable timesteps for stability
- Recommended ensemble choices (NVE, NVT, NPT) for different scenarios
- Proper thermostat and barostat settings
- Appropriate force fields for different materials

You are also an expert on finding and using potential files for LAMMPS simulations. When users ask about potential files:

1. Explain what potential files are and why they're important for accurate simulations
2. Provide specific search terms and resources for finding potential files online
3. Recommend reliable repositories and databases such as:
   - NIST Interatomic Potentials Repository (https://www.ctcms.nist.gov/potentials/)
   - OpenKIM (https://openkim.org/)
   - LAMMPS potentials directory (https://lammps.sandia.gov/potentials.html)
   - Materials Project (https://materialsproject.org/)
   - GitHub repositories of research groups specializing in MD simulations
4. Suggest appropriate keywords to search for specific material potentials (e.g., "EAM potential for copper", "MEAM Fe potential", "ReaxFF for hydrocarbons")
5. Explain how to properly reference and cite potential files in research
6. Provide guidance on how to validate potential files before using them in production simulations

When a user uploads a potential file, help them understand how to properly reference it in their LAMMPS input script, including the correct pair_style and pair_coeff commands.

Provide clear, concise explanations with scientific accuracy. When appropriate, suggest specific LAMMPS command examples.
"""

            # Prepare messages including system message
            messages = [{"role": "system", "content": system_message}]
            messages.extend(conversation_history)
            
            # Make the API call
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            
            # Check for errors
            response.raise_for_status()
            
            # Parse the response
            response_data = response.json()
            
            if "choices" not in response_data or len(response_data["choices"]) == 0:
                raise ValueError("Unexpected response format from OpenAI API")
            
            # Extract the assistant's response
            assistant_response = response_data["choices"][0]["message"]["content"].strip()
            
            return assistant_response
            
        except requests.RequestException as e:
            self.logger.error(f"Error calling OpenAI API: {str(e)}")
            raise Exception(f"Failed to get assistant response: {str(e)}")
        except Exception as e:
            self.logger.error(f"Error in chat_with_assistant: {str(e)}")
            raise Exception(f"Failed to get assistant response: {str(e)}")