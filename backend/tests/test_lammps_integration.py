import os
import pytest
import tempfile
import json
import time
from pathlib import Path

from app.services.lammps_service import LAMMPSService
from app.services.ase_service import ASEService

@pytest.fixture
def lammps_service():
    """Fixture to create a real LAMMPS service instance."""
    return LAMMPSService()

@pytest.fixture
def ase_service():
    """Fixture to create an ASE service instance."""
    return ASEService()

@pytest.fixture
def simple_lammps_input():
    """Fixture to create a simple LAMMPS input file for testing."""
    return """
# Simple Lennard-Jones simulation of argon
units           lj
atom_style      atomic
boundary        p p p

# Create simulation box and atoms
lattice         fcc 0.8442
region          box block 0 4 0 4 0 4
create_box      1 box
create_atoms    1 box
mass            1 1.0

# Define potential
pair_style      lj/cut 2.5
pair_coeff      1 1 1.0 1.0 2.5

# System initialization
velocity        all create 1.0 87287

# Settings
neighbor        0.3 bin
neigh_modify    every 1 delay 0 check yes

# Equilibration
fix             1 all nve
fix             2 all langevin 1.0 1.0 0.1 48279

# Run simulation
dump            1 all xyz 10 simulation.xyz
thermo          100
thermo_style    custom step temp pe ke etotal
timestep        0.005
run             100
"""

@pytest.mark.integration
def test_real_lammps_docker_simulation(lammps_service, simple_lammps_input):
    """
    Integration test that runs a real LAMMPS simulation using Docker.
    
    This test requires Docker to be running and the lammps/lammps image to be available.
    """
    # Skip if Docker is not available
    try:
        import docker
        client = docker.from_env()
        client.ping()  # Check if Docker daemon is responsive
    except Exception as e:
        pytest.skip(f"Docker not available: {str(e)}")
    
    # Check if LAMMPS image is available
    try:
        client.images.get("lammps/lammps:latest")
    except docker.errors.ImageNotFound:
        pytest.skip("LAMMPS Docker image not found. Pull it with 'docker pull lammps/lammps:latest'")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create input file
        input_file = Path(tmpdir) / "in.lj"
        lammps_service.create_input_file(simple_lammps_input, input_file)
        
        # Run the simulation with Docker
        start_time = time.time()
        result = lammps_service.run_simulation(input_file)
        end_time = time.time()
        
        # Verify the simulation was successful
        assert result["success"] is True, f"Simulation failed: {result.get('message', 'Unknown error')}"
        
        # Verify output files exist
        xyz_file = Path(tmpdir) / "simulation.xyz"
        assert xyz_file.exists(), "XYZ output file not created"
        assert xyz_file.stat().st_size > 0, "XYZ output file is empty"
        
        # Verify the simulation log contains expected LAMMPS output
        assert "LAMMPS" in result["log"], "LAMMPS signature not found in simulation log"
        assert "Step" in result["log"], "Timestep information not found in simulation log"
        assert "Loop time" in result["log"], "Simulation timing information not found in log"
        
        # Print some information about the simulation
        print(f"\nLAMMPS simulation completed in {end_time - start_time:.2f} seconds")
        print(f"Output file size: {xyz_file.stat().st_size} bytes")
        
        # Verify the XYZ file format is correct
        with open(xyz_file, 'r') as f:
            lines = f.readlines()
            assert len(lines) > 0, "XYZ file is empty"
            assert lines[0].strip().isdigit(), "First line should be the number of atoms"
            atom_count = int(lines[0].strip())
            assert atom_count > 0, "No atoms in the simulation"
            
            # Check that we have the expected number of frames
            # Each frame has atom_count + 2 lines (atom count, comment, and atom_count lines of coordinates)
            frame_size = atom_count + 2
            expected_frames = 11  # Initial + 10 frames (every 10 steps for 100 steps)
            
            # Allow for some flexibility in the number of frames
            min_expected_lines = frame_size * (expected_frames - 1)
            assert len(lines) >= min_expected_lines, f"XYZ file has fewer frames than expected: {len(lines)} lines, expected at least {min_expected_lines}"

@pytest.mark.integration
def test_real_lammps_analysis_pipeline(lammps_service, ase_service, simple_lammps_input):
    """
    Integration test for the full simulation and analysis pipeline using real Docker containers.
    
    This test runs a LAMMPS simulation and then analyzes the results with ASE.
    """
    # Skip if Docker is not available
    try:
        import docker
        client = docker.from_env()
        client.ping()
    except Exception as e:
        pytest.skip(f"Docker not available: {str(e)}")
    
    # Check if LAMMPS image is available
    try:
        client.images.get("lammps/lammps:latest")
    except docker.errors.ImageNotFound:
        pytest.skip("LAMMPS Docker image not found. Pull it with 'docker pull lammps/lammps:latest'")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create input file
        input_file = Path(tmpdir) / "in.lj"
        lammps_service.create_input_file(simple_lammps_input, input_file)
        
        # Run the simulation
        result = lammps_service.run_simulation(input_file)
        assert result["success"] is True, f"Simulation failed: {result.get('message', 'Unknown error')}"
        
        # Verify output files exist
        xyz_file = Path(tmpdir) / "simulation.xyz"
        assert xyz_file.exists(), "XYZ output file not created"
        
        # Print the contents of the XYZ file for debugging
        print("\nXYZ file contents:")
        with open(xyz_file, 'r') as f:
            xyz_content = f.read()
            print(xyz_content[:500])  # Print first 500 characters
            
        # Check file size
        file_size = xyz_file.stat().st_size
        print(f"XYZ file size: {file_size} bytes")
        
        # Analyze the results with ASE
        analysis_result = ase_service.analyze_trajectory(xyz_file)
        
        # Print analysis result for debugging
        print(f"Analysis result: {analysis_result}")
        
        # Verify analysis results
        assert "msd" in analysis_result, "Mean square displacement not calculated"
        assert "potential_energy" in analysis_result, "Potential energy not calculated"
        assert len(analysis_result["msd"]) > 0, "MSD data is empty"
        assert len(analysis_result["potential_energy"]) > 0, "Potential energy data is empty"
        
        # Verify that the analysis results can be serialized to JSON
        json_result = json.dumps(analysis_result)
        assert isinstance(json_result, str), "Analysis results cannot be serialized to JSON"
        
        # Print some information about the analysis
        print(f"\nTrajectory analysis completed")
        print(f"Number of frames analyzed: {len(analysis_result['msd'])}")
        print(f"Final MSD value: {analysis_result['msd'][-1]}") 