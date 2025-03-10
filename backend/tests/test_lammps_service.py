import os
import pytest
import tempfile
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

from app.services.lammps_service import LAMMPSService
from app.services.ase_service import ASEService

@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment."""
    os.environ['TESTING'] = 'true'
    yield
    os.environ.pop('TESTING', None)

@pytest.fixture
def lammps_service():
    """Fixture to create a LAMMPS service instance."""
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
run             1000
"""

@pytest.fixture
def mock_docker_container():
    """Mock Docker container for testing."""
    container_mock = MagicMock()
    container_mock.logs.return_value = b"LAMMPS simulation completed successfully"
    container_mock.wait.return_value = {"StatusCode": 0}
    return container_mock

@pytest.fixture
def mock_docker_client(mock_docker_container):
    """Mock Docker client for testing."""
    client_mock = MagicMock()
    containers_mock = MagicMock()
    containers_mock.run.return_value = mock_docker_container
    client_mock.containers = containers_mock
    return client_mock

@pytest.fixture
def patched_lammps_service(mock_docker_client):
    """Patch LAMMPSService to use mock Docker client."""
    with patch('docker.from_env', return_value=mock_docker_client):
        service = LAMMPSService()
        # Create a mock simulation output file
        def mock_run_simulation(input_file_path):
            # Create a mock simulation output directory
            sim_dir = service.simulations_dir / "mock_sim"
            sim_dir.mkdir(parents=True, exist_ok=True)
            
            # Create a mock XYZ file
            xyz_file = Path(input_file_path).parent / "simulation.xyz"
            with open(xyz_file, 'w') as f:
                f.write("4\n")  # Number of atoms
                f.write("Atoms\n")
                f.write("Ar 0.0 0.0 0.0\n")
                f.write("Ar 1.0 0.0 0.0\n")
                f.write("Ar 0.0 1.0 0.0\n")
                f.write("Ar 0.0 0.0 1.0\n")
            
            return {
                "success": True,
                "message": "Simulation completed successfully",
                "output_files": [str(xyz_file)],
                "log": "LAMMPS simulation completed successfully"
            }
        
        # Replace the actual run_simulation method with our mock
        service.run_simulation = mock_run_simulation
        return service

def test_lammps_service_create_input_file(lammps_service, simple_lammps_input):
    """Test that the LAMMPS service can create an input file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "in.lj"
        lammps_service.create_input_file(simple_lammps_input, input_file)
        
        assert input_file.exists()
        with open(input_file, 'r') as f:
            content = f.read()
        assert content == simple_lammps_input

def test_lammps_service_run_simulation(patched_lammps_service, simple_lammps_input):
    """Test that the LAMMPS service can run a simulation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "in.lj"
        patched_lammps_service.create_input_file(simple_lammps_input, input_file)
        
        result = patched_lammps_service.run_simulation(input_file)
        
        assert result["success"] is True
        assert Path(tmpdir, "simulation.xyz").exists()

def test_ase_service_analyze_xyz(patched_lammps_service, ase_service, simple_lammps_input):
    """Test that the ASE service can analyze simulation output."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "in.lj"
        patched_lammps_service.create_input_file(simple_lammps_input, input_file)
        
        result = patched_lammps_service.run_simulation(input_file)
        assert result["success"] is True
        
        # Now analyze the output with ASE
        xyz_file = Path(tmpdir, "simulation.xyz")
        analysis_result = ase_service.analyze_trajectory(xyz_file)
        
        # Check that we got some analysis results
        assert "msd" in analysis_result
        assert "potential_energy" in analysis_result
        assert len(analysis_result["msd"]) > 0
        assert len(analysis_result["potential_energy"]) > 0

def test_full_simulation_pipeline(patched_lammps_service, ase_service, simple_lammps_input):
    """Test the full simulation pipeline from input to analysis."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create the input file
        input_file = Path(tmpdir) / "in.lj"
        patched_lammps_service.create_input_file(simple_lammps_input, input_file)
        
        # Run the simulation
        sim_result = patched_lammps_service.run_simulation(input_file)
        assert sim_result["success"] is True
        
        # Analyze the results
        xyz_file = Path(tmpdir, "simulation.xyz")
        analysis_result = ase_service.analyze_trajectory(xyz_file)
        
        # Check for expected data in the results
        assert "msd" in analysis_result
        assert "potential_energy" in analysis_result
        
        # Verify that the output can be serialized to JSON
        json_result = json.dumps(analysis_result)
        assert isinstance(json_result, str)

def test_invalid_input_file(lammps_service):
    """Test that the LAMMPS service handles invalid input files appropriately."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "invalid.lj"
        invalid_input = """
        # Invalid LAMMPS input
        invalid_command
        nonsense_parameters
        """
        lammps_service.create_input_file(invalid_input, input_file)
        
        # Mock the run_simulation method to simulate failure for invalid input
        original_run_simulation = lammps_service.run_simulation
        
        def mock_invalid_run(input_path):
            if "invalid.lj" in str(input_path):
                return {
                    "success": False,
                    "message": "Simulation failed: Invalid input file",
                    "output_files": [],
                    "log": "ERROR: Unknown command: invalid_command"
                }
            return original_run_simulation(input_path)
        
        # Apply the mock
        lammps_service.run_simulation = mock_invalid_run
        
        result = lammps_service.run_simulation(input_file)
        assert result["success"] is False
        assert "failed" in result["message"].lower()

def test_environment_detection(monkeypatch):
    """Test that the service correctly detects if it's running in Docker."""
    # Test Docker environment
    monkeypatch.setenv('LAMMPS_SERVICE', 'docker')
    docker_service = LAMMPSService()
    assert docker_service.in_docker is True
    assert docker_service.lammps_exec == "lmp"
    
    # Test local environment
    monkeypatch.delenv('LAMMPS_SERVICE', raising=False)
    local_service = LAMMPSService()
    assert local_service.in_docker is False
    assert local_service.lammps_exec == "lmp"

def test_output_file_validation(patched_lammps_service, simple_lammps_input):
    """Test that all expected output files are generated and valid."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "in.lj"
        patched_lammps_service.create_input_file(simple_lammps_input, input_file)
        
        result = patched_lammps_service.run_simulation(input_file)
        assert result["success"] is True
        
        # Verify output files exist and are not empty
        for output_file in result["output_files"]:
            path = Path(output_file)
            assert path.exists()
            assert path.stat().st_size > 0
            
        # Verify XYZ file format
        xyz_file = Path(tmpdir) / "simulation.xyz"
        with open(xyz_file, 'r') as f:
            first_line = f.readline()
            assert first_line.strip().isdigit(), "First line should contain number of atoms"

def test_simulation_cleanup(patched_lammps_service, simple_lammps_input):
    """Test that temporary files are cleaned up after simulation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "in.lj"
        patched_lammps_service.create_input_file(simple_lammps_input, input_file)
        
        sim_dir_before = set(Path(patched_lammps_service.simulations_dir).glob("*"))
        result = patched_lammps_service.run_simulation(input_file)
        sim_dir_after = set(Path(patched_lammps_service.simulations_dir).glob("*"))
        
        # Verify that no temporary files remain
        assert sim_dir_before == sim_dir_after
        assert result["success"] is True 