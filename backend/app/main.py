import os
import tempfile
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks, Response, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import re
import uuid
import json
import shutil
from dotenv import load_dotenv
import math

# Load environment variables from .env file
load_dotenv()

from app.services.lammps_service import LAMMPSService
from app.services.ase_service import ASEService
from app.services.openai_service import OpenAIService
from app.services.db_service import DBService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize the app
app = FastAPI(
    title="LAMMPS Simulation API",
    description="API for running molecular dynamics simulations with LAMMPS and analyzing results",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, in production restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
lammps_service = LAMMPSService()
ase_service = ASEService()
openai_service = OpenAIService()
db_service = DBService()

# Temporary directory for storing simulation files
TEMP_DIR = Path(tempfile.gettempdir()) / "lammps_simulations"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Dictionary to store trajectory file paths by ID
trajectory_files_by_id = {}

# Dictionary to store potential files by ID
potential_files_by_id = {}

# Data models
class InputFileRequest(BaseModel):
    input_content: str
    potential_file_id: Optional[str] = None

class SimulationResponse(BaseModel):
    msd: Optional[List[Optional[float]]] = None
    kinetic_energy: Optional[List[Optional[float]]] = None
    frames: Optional[int] = None
    atoms: Optional[int] = None
    error: Optional[str] = None
    trajectory_file_id: Optional[str] = None  # ID to retrieve the trajectory file
    simulation_id: Optional[str] = None  # ID to retrieve the simulation record

class NLPromptRequest(BaseModel):
    prompt: str
    potential_file_id: Optional[str] = None

class InputFileResponse(BaseModel):
    input_content: str
    prompt: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Dict[str, str]]

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Upload potential file endpoint
@app.post("/upload-potential/")
async def upload_potential_file(file: UploadFile = File(...), user_id: Optional[str] = Header(None)):
    """Upload a potential file for use in LAMMPS simulations."""
    try:
        # Read the file content
        content = await file.read()
        content_str = content.decode("utf-8")
        
        # Generate a unique ID for the file
        file_id = str(uuid.uuid4())
        
        # Save the file to disk
        file_path = Path(TEMP_DIR) / f"potential_{file_id}"
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Store the file path for later use
        potential_files_by_id[file_id] = str(file_path)
        
        # Save to database
        if db_service:
            try:
                db_result = await db_service.save_potential_file(
                    filename=file.filename,
                    content=content_str,
                    file_path=str(file_path),
                    user_id=user_id
                )
                logger.info(f"Saved potential file to database with ID: {db_result.get('id')}")
                # Use the database ID instead if available
                if db_result and "id" in db_result:
                    file_id = db_result["id"]
                    potential_files_by_id[file_id] = str(file_path)
            except Exception as e:
                logger.warning(f"Failed to save potential file to database: {str(e)}")
        
        logger.info(f"Uploaded potential file: {file.filename} with ID: {file_id}")
        
        return {
            "potential_file_id": file_id,
            "filename": file.filename
        }
    except Exception as e:
        logger.exception(f"Error uploading potential file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

# Run LAMMPS simulation endpoint
@app.post("/run-lammps/", response_model=SimulationResponse)
async def run_lammps(input_file: InputFileRequest, user_id: Optional[str] = Header(None)):
    """Run a LAMMPS simulation with the provided input file."""
    if not input_file.input_content:
        raise HTTPException(status_code=400, detail="Empty input file")
    
    try:
        # Create a temporary directory for the simulation
        sim_id = os.urandom(4).hex()
        sim_dir = Path(TEMP_DIR) / f"sim_{sim_id}"
        sim_dir.mkdir(parents=True, exist_ok=True)
        
        # Create the input file
        input_file_path = sim_dir / "input.lammps"
        with open(input_file_path, "w") as f:
            f.write(input_file.input_content)
        
        # Save to database
        db_input_id = None
        if db_service:
            try:
                # Save the input file
                input_result = await db_service.save_simulation_input(
                    content=input_file.input_content,
                    name=f"Simulation {sim_id}",
                    potential_file_id=input_file.potential_file_id,
                    user_id=user_id
                )
                logger.info(f"Saved simulation input to database with ID: {input_result.get('id')}")
                db_input_id = input_result.get("id")
            except Exception as e:
                logger.warning(f"Failed to save simulation input to database: {str(e)}")
        
        # Copy potential file if provided
        if input_file.potential_file_id and input_file.potential_file_id in potential_files_by_id:
            potential_file_path = Path(potential_files_by_id[input_file.potential_file_id])
            if potential_file_path.exists():
                # Copy to simulation directory with original filename
                shutil.copy(potential_file_path, sim_dir / potential_file_path.name)
                logger.info(f"Copied potential file {potential_file_path.name} to simulation directory")
        
        # Create simulation record in database
        db_simulation_id = None
        if db_service and db_input_id:
            try:
                sim_result = await db_service.create_simulation(
                    input_id=db_input_id,
                    user_id=user_id
                )
                logger.info(f"Created simulation record in database with ID: {sim_result.get('id')}")
                db_simulation_id = sim_result.get("id")
            except Exception as e:
                logger.warning(f"Failed to create simulation record in database: {str(e)}")
        
        # Run the simulation
        result = lammps_service.run_simulation(input_file_path)
        
        if not result["success"]:
            logger.error(f"Simulation failed: {result['message']}")
            
            # Update simulation status in database
            if db_service and db_simulation_id:
                try:
                    await db_service.update_simulation_results(
                        simulation_id=db_simulation_id,
                        results={"error": result['message']}
                    )
                except Exception as e:
                    logger.warning(f"Failed to update simulation status in database: {str(e)}")
            
            return SimulationResponse(error=f"Simulation failed: {result['message']}")
        
        # Get the analysis results
        analysis_result = result["analysis"]
        
        # Update simulation results in database
        if db_service and db_simulation_id:
            try:
                # Prepare results for database
                db_results = {
                    "trajectory_file_path": str(result.get("trajectory_file_path", "")),
                    "velocity_file_path": str(result.get("velocity_file_path", "")),
                    "msd": analysis_result.get("msd"),
                    "kinetic_energy": analysis_result.get("kinetic_energy"),
                    "frames": analysis_result.get("frames"),
                    "atoms": analysis_result.get("atoms")
                }
                
                await db_service.update_simulation_results(
                    simulation_id=db_simulation_id,
                    results=db_results
                )
                logger.info(f"Updated simulation results in database for ID: {db_simulation_id}")
            except Exception as e:
                logger.warning(f"Failed to update simulation results in database: {str(e)}")
        
        # Handle NaN values in the analysis results
        msd = analysis_result.get("msd")
        kinetic_energy = analysis_result.get("kinetic_energy")
        
        # Convert NaN values to None for JSON compatibility
        if msd is not None:
            msd = [None if (x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x)))) else x for x in msd]
        
        if kinetic_energy is not None:
            kinetic_energy = [None if (x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x)))) else x for x in kinetic_energy]
        
        # Return the analysis results
        return SimulationResponse(
            msd=msd,
            kinetic_energy=kinetic_energy,
            frames=analysis_result.get("frames"),
            atoms=analysis_result.get("atoms"),
            trajectory_file_id=analysis_result.get("trajectory_file_id"),
            simulation_id=db_simulation_id  # Include the database ID
        )
    except Exception as e:
        logger.exception(f"Error running LAMMPS simulation: {str(e)}")
        return SimulationResponse(error=f"Error running simulation: {str(e)}")

# Endpoint to get trajectory file content
@app.get("/trajectory/{file_id}")
async def get_trajectory_file(file_id: str):
    """Get the content of a trajectory file by ID."""
    if file_id not in trajectory_files_by_id:
        raise HTTPException(status_code=404, detail="Trajectory file not found")
    
    try:
        file_path = trajectory_files_by_id[file_id]
        with open(file_path, 'r') as f:
            content = f.read()
        
        return Response(
            content=content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=trajectory.xyz"
            }
        )
    except Exception as e:
        logger.exception(f"Error reading trajectory file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading trajectory file: {str(e)}")

# Generate LAMMPS input file from natural language
@app.post("/generate-input/", response_model=InputFileResponse)
async def generate_lammps_input(prompt_request: NLPromptRequest):
    """Generate a LAMMPS input file from a natural language prompt."""
    
    if not prompt_request.prompt:
        raise HTTPException(status_code=400, detail="Empty prompt")
    
    try:
        # Get potential file content if provided
        potential_file_content = None
        potential_file_name = None
        
        if prompt_request.potential_file_id and prompt_request.potential_file_id in potential_files_by_id:
            potential_file_path = Path(potential_files_by_id[prompt_request.potential_file_id])
            potential_file_name = potential_file_path.name
            
            # Read the content of the potential file
            if potential_file_path.exists():
                try:
                    with open(potential_file_path, 'r') as f:
                        potential_file_content = f.read()
                    logger.info(f"Read potential file: {potential_file_name}")
                except Exception as e:
                    logger.error(f"Error reading potential file: {str(e)}")
            
            # Enhance prompt with potential file information and content
            if potential_file_content:
                enhanced_prompt = f"""
{prompt_request.prompt}

I have a potential file named '{potential_file_name}' with the following content:

```
{potential_file_content}
```

Please generate a LAMMPS input file that directly incorporates the parameters from this potential file into the input script, rather than using include or read_data commands. The parameters should be integrated directly into the appropriate LAMMPS commands in the input file.
"""
            else:
                enhanced_prompt = f"{prompt_request.prompt}\n\nUse the potential file named '{potential_file_name}' in the simulation."
        else:
            enhanced_prompt = prompt_request.prompt
        
        # Generate input file
        input_content = openai_service.generate_lammps_input(enhanced_prompt)
        
        # Return the result
        return InputFileResponse(
            input_content=input_content,
            prompt=prompt_request.prompt
        )
    except Exception as e:
        logger.exception("Error generating LAMMPS input")
        raise HTTPException(status_code=500, detail=f"Error generating input: {str(e)}")

# Chat with LAMMPS assistant
@app.post("/chat/", response_model=ChatResponse)
async def chat_with_assistant(chat_request: ChatRequest):
    """Chat with a LAMMPS simulation assistant."""
    
    if not chat_request.message:
        raise HTTPException(status_code=400, detail="Empty message")
    
    try:
        # Initialize conversation history if not provided
        conversation_history = chat_request.conversation_history or []
        
        # Add user message to history
        conversation_history.append({"role": "user", "content": chat_request.message})
        
        # Call OpenAI API for chat response
        response = openai_service.chat_with_assistant(conversation_history)
        
        # Add assistant response to history
        conversation_history.append({"role": "assistant", "content": response})
        
        # Return the result
        return ChatResponse(
            response=response,
            conversation_history=conversation_history
        )
    except Exception as e:
        logger.exception("Error in chat with assistant")
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")

# Clean up old simulations
@app.post("/cleanup/", status_code=204)
async def cleanup_simulations(background_tasks: BackgroundTasks):
    """Clean up old simulation files."""
    
    def _cleanup():
        """Cleanup function to be run in the background."""
        try:
            # Delete directories older than 24 hours
            import time
            current_time = time.time()
            
            for sim_dir in TEMP_DIR.iterdir():
                if sim_dir.is_dir():
                    # Check if directory is older than 24 hours
                    if current_time - sim_dir.stat().st_mtime > 86400:
                        # Delete the directory
                        import shutil
                        shutil.rmtree(sim_dir)
        except Exception as e:
            logger.error(f"Error cleaning up simulations: {str(e)}")
    
    # Add the cleanup task to run in the background
    background_tasks.add_task(_cleanup)
    
    return None

# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_keep_alive=300)
