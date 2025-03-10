import os
import logging
import json
import uuid
from typing import Dict, Any, Optional
import httpx
from pathlib import Path

logger = logging.getLogger(__name__)

HASURA_URL = os.environ.get("HASURA_URL", "http://hasura:8080/v1/graphql")
HASURA_ADMIN_SECRET = os.environ.get("HASURA_ADMIN_SECRET", "myadminsecretkey")

class DBService:
    """Service for database operations via Hasura GraphQL."""
    
    def __init__(self):
        """Initialize the database service."""
        self.headers = {
            "Content-Type": "application/json",
            "X-Hasura-Admin-Secret": HASURA_ADMIN_SECRET
        }
    
    async def save_potential_file(self, filename: str, content: str, file_path: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Save a potential file to the database.
        
        Args:
            filename (str): The name of the file.
            content (str): The content of the file.
            file_path (str): The path to the file.
            user_id (str, optional): The ID of the user who uploaded the file.
            
        Returns:
            Dict[str, Any]: The created potential file record.
        """
        query = """
        mutation InsertPotentialFile($filename: String!, $content: String!, $file_path: String!, $user_id: uuid) {
            insert_potential_files_one(object: {
                filename: $filename,
                content: $content,
                file_path: $file_path,
                user_id: $user_id
            }) {
                id
                filename
                file_path
                created_at
            }
        }
        """
        
        variables = {
            "filename": filename,
            "content": content,
            "file_path": file_path,
            "user_id": user_id
        }
        
        return await self._execute_query(query, variables)
    
    async def save_simulation_input(self, content: str, name: Optional[str] = None, 
                                   potential_file_id: Optional[str] = None, 
                                   user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Save a simulation input to the database.
        
        Args:
            content (str): The content of the input file.
            name (str, optional): The name of the input.
            potential_file_id (str, optional): The ID of the associated potential file.
            user_id (str, optional): The ID of the user who created the input.
            
        Returns:
            Dict[str, Any]: The created simulation input record.
        """
        query = """
        mutation InsertSimulationInput($content: String!, $name: String, $potential_file_id: uuid, $user_id: uuid) {
            insert_simulation_inputs_one(object: {
                content: $content,
                name: $name,
                potential_file_id: $potential_file_id,
                user_id: $user_id
            }) {
                id
                name
                created_at
            }
        }
        """
        
        variables = {
            "content": content,
            "name": name,
            "potential_file_id": potential_file_id,
            "user_id": user_id
        }
        
        return await self._execute_query(query, variables)
    
    async def create_simulation(self, input_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new simulation record.
        
        Args:
            input_id (str): The ID of the simulation input.
            user_id (str, optional): The ID of the user who created the simulation.
            
        Returns:
            Dict[str, Any]: The created simulation record.
        """
        query = """
        mutation CreateSimulation($input_id: uuid!, $user_id: uuid) {
            insert_simulations_one(object: {
                input_id: $input_id,
                status: "pending",
                user_id: $user_id
            }) {
                id
                status
                created_at
            }
        }
        """
        
        variables = {
            "input_id": input_id,
            "user_id": user_id
        }
        
        return await self._execute_query(query, variables)
    
    async def update_simulation_results(self, simulation_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a simulation with its results.
        
        Args:
            simulation_id (str): The ID of the simulation.
            results (Dict[str, Any]): The simulation results.
            
        Returns:
            Dict[str, Any]: The updated simulation record.
        """
        query = """
        mutation UpdateSimulationResults(
            $id: uuid!,
            $status: String!,
            $trajectory_file_path: String,
            $velocity_file_path: String,
            $msd: jsonb,
            $kinetic_energy: jsonb,
            $frames: Int,
            $atoms: Int,
            $error: String
        ) {
            update_simulations_by_pk(
                pk_columns: {id: $id},
                _set: {
                    status: $status,
                    trajectory_file_path: $trajectory_file_path,
                    velocity_file_path: $velocity_file_path,
                    msd: $msd,
                    kinetic_energy: $kinetic_energy,
                    frames: $frames,
                    atoms: $atoms,
                    error: $error
                }
            ) {
                id
                status
                updated_at
            }
        }
        """
        
        # Prepare variables
        variables = {
            "id": simulation_id,
            "status": "completed" if not results.get("error") else "failed",
            "trajectory_file_path": results.get("trajectory_file_path"),
            "velocity_file_path": results.get("velocity_file_path"),
            "msd": json.dumps(results.get("msd")) if results.get("msd") else None,
            "kinetic_energy": json.dumps(results.get("kinetic_energy")) if results.get("kinetic_energy") else None,
            "frames": results.get("frames"),
            "atoms": results.get("atoms"),
            "error": results.get("error")
        }
        
        return await self._execute_query(query, variables)
    
    async def get_simulation(self, simulation_id: str) -> Dict[str, Any]:
        """
        Get a simulation by ID.
        
        Args:
            simulation_id (str): The ID of the simulation.
            
        Returns:
            Dict[str, Any]: The simulation record.
        """
        query = """
        query GetSimulation($id: uuid!) {
            simulations_by_pk(id: $id) {
                id
                status
                trajectory_file_path
                velocity_file_path
                msd
                kinetic_energy
                frames
                atoms
                error
                created_at
                updated_at
                input {
                    id
                    name
                    content
                    potential_file {
                        id
                        filename
                    }
                }
            }
        }
        """
        
        variables = {
            "id": simulation_id
        }
        
        return await self._execute_query(query, variables)
    
    async def _execute_query(self, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a GraphQL query.
        
        Args:
            query (str): The GraphQL query.
            variables (Dict[str, Any]): The variables for the query.
            
        Returns:
            Dict[str, Any]: The query result.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    HASURA_URL,
                    headers=self.headers,
                    json={
                        "query": query,
                        "variables": variables
                    }
                )
                
                response.raise_for_status()
                result = response.json()
                
                if "errors" in result:
                    logger.error(f"GraphQL error: {result['errors']}")
                    raise Exception(f"GraphQL error: {result['errors']}")
                
                # Extract the data from the first key in the data object
                data_key = next(iter(result["data"]))
                return result["data"][data_key]
        except Exception as e:
            logger.exception(f"Error executing GraphQL query: {str(e)}")
            raise 