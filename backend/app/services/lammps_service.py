import os
import subprocess
import logging
from pathlib import Path
import tempfile
import shutil
import time
import json
import re

class LAMMPSService:
    """Service for running LAMMPS simulations."""
    
    def __init__(self):
        """Initialize the LAMMPS service."""
        self.logger = logging.getLogger(__name__)
        
        # Check if we're running in a Docker container
        self.in_docker = os.environ.get('LAMMPS_SERVICE') == 'docker'
        
        # Set the path to the LAMMPS executable
        self.lammps_exec = "lmp" if self.in_docker else "lmp"
        
        # Use a test-friendly directory path
        if os.environ.get('TESTING') == 'true':
            self.simulations_dir = Path(tempfile.gettempdir()) / "lammps_test_simulations"
        else:
            self.simulations_dir = Path("/app/simulations") if self.in_docker else Path(tempfile.gettempdir()) / "lammps_simulations"
        
        # Create simulations directory if it doesn't exist
        if not self.simulations_dir.exists():
            self.simulations_dir.mkdir(parents=True, exist_ok=True)
            
        self.logger.info(f"LAMMPS service initialized with executable: {self.lammps_exec}")
        self.logger.info(f"Running in Docker: {self.in_docker}")
        self.logger.info(f"Simulations directory: {self.simulations_dir}")
    
    def create_input_file(self, input_content, input_file_path):
        """
        Create a LAMMPS input file.
        
        Args:
            input_content (str): The content of the LAMMPS input file.
            input_file_path (Path): The path where to save the input file.
            
        Returns:
            Path: The path to the created input file.
        """
        # Ensure the directory exists
        input_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the input file
        with open(input_file_path, 'w') as f:
            f.write(input_content)
        
        return input_file_path
    
    def extract_dump_filename(self, input_content):
        """
        Extract the dump filename from the input content.
        
        Args:
            input_content (str): The content of the LAMMPS input file.
            
        Returns:
            tuple: A tuple containing (xyz_filename, velocity_filename) or (None, None) if not found.
        """
        # Look for dump commands
        xyz_filename = None
        velocity_filename = None
        
        # Extract XYZ dump filename
        xyz_match = re.search(r'dump\s+\d+\s+all\s+xyz\s+\d+\s+(\S+)', input_content)
        if xyz_match:
            xyz_filename = xyz_match.group(1)
            self.logger.info(f"Found XYZ dump filename: {xyz_filename}")
        
        # Extract velocity dump filename
        vel_match = re.search(r'dump\s+\d+\s+all\s+custom\s+\d+\s+(\S+).*v[xyz]', input_content)
        if vel_match:
            velocity_filename = vel_match.group(1)
            self.logger.info(f"Found velocity dump filename: {velocity_filename}")
        
        return xyz_filename, velocity_filename
    
    def ensure_masses_set(self, input_content):
        """
        Ensure that all atom types have masses set in the input file.
        If masses are not set, add default mass settings.
        
        Args:
            input_content (str): The content of the LAMMPS input file.
            
        Returns:
            str: The modified input content with mass settings.
        """
        # Check if masses are already set
        if re.search(r'mass\s+\d+\s+\d+\.?\d*', input_content):
            return input_content
        
        # Extract atom types from create_box command
        create_box_match = re.search(r'create_box\s+(\d+)', input_content)
        if not create_box_match:
            self.logger.warning("Could not find create_box command to determine atom types")
            return input_content
        
        num_types = int(create_box_match.group(1))
        self.logger.info(f"Found {num_types} atom types in create_box command")
        
        # Find a good place to insert mass commands (after create_atoms)
        lines = input_content.split('\n')
        modified_lines = []
        mass_added = False
        
        for i, line in enumerate(lines):
            modified_lines.append(line)
            
            # Add mass commands after create_atoms
            if not mass_added and re.search(r'create_atoms', line):
                # Add an empty line for readability
                modified_lines.append("")
                
                # Add mass commands for each atom type
                for atom_type in range(1, num_types + 1):
                    modified_lines.append(f"mass {atom_type} 1.0  # Default mass added automatically")
                
                # Add another empty line
                modified_lines.append("")
                mass_added = True
        
        # If we couldn't find create_atoms, add mass commands before the first run command
        if not mass_added:
            for i, line in enumerate(lines):
                if re.search(r'run', line):
                    # Insert mass commands before run
                    mass_lines = []
                    mass_lines.append("")
                    for atom_type in range(1, num_types + 1):
                        mass_lines.append(f"mass {atom_type} 1.0  # Default mass added automatically")
                    mass_lines.append("")
                    
                    # Combine the lines
                    modified_lines = lines[:i] + mass_lines + lines[i:]
                    mass_added = True
                    break
        
        # If we still couldn't add mass commands, add them at the end
        if not mass_added:
            modified_lines.append("")
            for atom_type in range(1, num_types + 1):
                modified_lines.append(f"mass {atom_type} 1.0  # Default mass added automatically")
        
        self.logger.info("Added default mass settings to input file")
        return '\n'.join(modified_lines)
    
    def validate_input_file(self, input_content):
        """
        Validate a LAMMPS input file content.
        
        Args:
            input_content (str): The content of the LAMMPS input file.
            
        Returns:
            tuple: (is_valid, message) where is_valid is a boolean and message is a string.
        """
        # Check for empty content
        if not input_content or not input_content.strip():
            return False, "Input file is empty"
        
        # Check for required commands
        required_commands = ['units', 'atom_style', 'run']
        missing_commands = [cmd for cmd in required_commands if cmd not in input_content]
        if missing_commands:
            return False, f"Missing required commands: {', '.join(missing_commands)}"
        
        # Check for dump command
        if 'dump' not in input_content:
            return False, "Missing dump command for trajectory output"
        
        # Check for file references that might not exist
        file_commands = ['read_data', 'read_restart', 'include', 'read_dump']
        for cmd in file_commands:
            if cmd in input_content:
                # Extract the filename
                pattern = rf"{cmd}\s+(\S+)"
                matches = re.findall(pattern, input_content)
                if matches:
                    self.logger.warning(f"Input file references external file: {matches[0]} with command {cmd}")
        
        # Check if masses are set
        if not re.search(r'mass\s+\d+\s+\d+\.?\d*', input_content):
            self.logger.warning("No mass settings found in input file. Will add default masses.")
        
        return True, "Input file is valid"
    
    def run_simulation(self, input_file_path):
        """
        Run a LAMMPS simulation.
        
        Args:
            input_file_path (Path): The path to the LAMMPS input file.
            
        Returns:
            dict: A dictionary with the simulation results.
        """
        # Validate the input file exists
        if not input_file_path.exists():
            return {
                "success": False,
                "message": f"Input file not found: {input_file_path}"
            }
        
        # Read and validate the input file content
        try:
            with open(input_file_path, 'r') as f:
                input_content = f.read()
            
            is_valid, message = self.validate_input_file(input_content)
            if not is_valid:
                return {
                    "success": False,
                    "message": message
                }
            
            # Ensure masses are set
            modified_content = self.ensure_masses_set(input_content)
            if modified_content != input_content:
                # Write the modified content back to the input file
                with open(input_file_path, 'w') as f:
                    f.write(modified_content)
                self.logger.info("Updated input file with mass settings")
                input_content = modified_content
            
            # Extract the dump filename
            xyz_filename, velocity_filename = self.extract_dump_filename(input_content)
            if xyz_filename or velocity_filename:
                self.logger.info(f"Detected XYZ dump filename: {xyz_filename}")
                self.logger.info(f"Detected velocity dump filename: {velocity_filename}")
        except Exception as e:
            return {
                "success": False,
                "message": f"Error reading input file: {str(e)}"
            }
        
        # Always run the simulation locally
        self.logger.info("Running simulation locally")
        return self._run_local_simulation(input_file_path, xyz_filename, velocity_filename)
    
    def _run_local_simulation(self, input_file_path, xyz_filename=None, velocity_filename=None):
        """
        Run a LAMMPS simulation locally.
        
        Args:
            input_file_path (Path): The path to the LAMMPS input file.
            xyz_filename (str, optional): The expected XYZ dump filename from the input file.
            velocity_filename (str, optional): The expected velocity dump filename from the input file.
            
        Returns:
            dict: A dictionary with the simulation results.
        """
        # Create a temporary directory for the simulation
        sim_id = os.urandom(4).hex()
        tmpdir = self.simulations_dir / f"sim_{sim_id}"
        tmpdir.mkdir(parents=True, exist_ok=True)
        
        # Copy the input file to the temporary directory
        local_input_path = tmpdir / "input.lammps"
        shutil.copy(input_file_path, local_input_path)
        
        # Copy any potential files to the temporary directory
        input_dir = input_file_path.parent
        for file in input_dir.glob("*"):
            if file.name != input_file_path.name and file.is_file():
                shutil.copy(file, tmpdir / file.name)
                self.logger.info(f"Copied potential file: {file.name} to simulation directory")
        
        # Run the simulation
        try:
            self.logger.info(f"Running LAMMPS simulation in {tmpdir}")
            start_time = time.time()
            
            # Run LAMMPS
            cmd = [self.lammps_exec, "-in", str(local_input_path)]
            self.logger.info(f"Running command: {' '.join(cmd)}")
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=str(tmpdir),
                text=True
            )
            
            stdout, stderr = process.communicate()
            
            end_time = time.time()
            elapsed = end_time - start_time
            
            self.logger.info(f"LAMMPS simulation completed in {elapsed:.2f} seconds")
            self.logger.debug(f"LAMMPS stdout: {stdout}")
            
            if process.returncode != 0:
                self.logger.error(f"LAMMPS simulation failed with exit code {process.returncode}")
                self.logger.error(f"LAMMPS stderr: {stderr}")
                return {
                    "success": False,
                    "message": f"Simulation failed with exit code {process.returncode}: {stderr}"
                }
            
            # Find trajectory files
            trajectory_files = []
            velocity_files = []
            output_files = list(tmpdir.glob("*"))
            
            # Check for the specified files if provided
            if xyz_filename and Path(tmpdir) / xyz_filename in output_files:
                trajectory_files.append(Path(tmpdir) / xyz_filename)
                self.logger.info(f"Found specified XYZ file: {xyz_filename}")
            
            if velocity_filename and Path(tmpdir) / velocity_filename in output_files:
                velocity_files.append(Path(tmpdir) / velocity_filename)
                self.logger.info(f"Found specified velocity file: {velocity_filename}")
            
            # If no trajectory files found, check for any dump files
            if not trajectory_files:
                for file in output_files:
                    if file.name.endswith(".xyz") or "dump" in file.name.lower():
                        trajectory_files.append(file)
                        self.logger.info(f"Found trajectory file: {file.name}")
            
            # If no velocity files found, check for any velocity files
            if not velocity_files:
                for file in output_files:
                    if file.name.endswith(".vel") or ("dump" in file.name.lower() and "vel" in file.name.lower()):
                        velocity_files.append(file)
                        self.logger.info(f"Found velocity file: {file.name}")
            
            # If no trajectory files found, return an error
            if not trajectory_files:
                self.logger.error("No trajectory files found")
                return {
                    "success": False,
                    "message": "No trajectory files found"
                }
            
            # Use the first trajectory file for analysis
            trajectory_file = trajectory_files[0]
            velocity_file = velocity_files[0] if velocity_files else None
            
            # Copy the trajectory file to a more permanent location
            trajectory_id = os.urandom(4).hex()
            permanent_trajectory = self.simulations_dir / f"trajectory_{trajectory_id}.xyz"
            shutil.copy(trajectory_file, permanent_trajectory)
            self.logger.info(f"Copied trajectory file to {permanent_trajectory}")
            
            # Copy the velocity file to a more permanent location if it exists
            permanent_velocity = None
            if velocity_file:
                velocity_id = os.urandom(4).hex()
                permanent_velocity = self.simulations_dir / f"velocity_{velocity_id}.vel"
                shutil.copy(velocity_file, permanent_velocity)
                self.logger.info(f"Copied velocity file to {permanent_velocity}")
            
            # Analyze the trajectory
            from app.services.ase_service import ASEService
            ase_service = ASEService()
            
            analysis_result = ase_service.analyze_trajectory(
                trajectory_path=permanent_trajectory,
                velocity_path=permanent_velocity
            )
            
            # Add the trajectory file ID to the result
            analysis_result["trajectory_file_id"] = trajectory_id
            
            return {
                "success": True,
                "message": "Simulation completed successfully",
                "analysis": analysis_result
            }
            
        except Exception as e:
            self.logger.exception(f"Error running LAMMPS simulation: {str(e)}")
            return {
                "success": False,
                "message": f"Error running simulation: {str(e)}"
            } 