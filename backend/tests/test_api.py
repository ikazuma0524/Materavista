import os
import pytest
from fastapi.testclient import TestClient
from unittest import mock

from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_run_lammps_with_valid_input():
    """Test running a LAMMPS simulation with valid input."""
    # Prepare test data
    input_content = """
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
    
    # Settings
    neighbor        0.3 bin
    neigh_modify    every 1 delay 0 check yes
    
    # Run simulation
    dump            1 all xyz 10 simulation.xyz
    thermo          100
    timestep        0.005
    run             100
    """
    
    # Run the test with actual simulation
    response = client.post(
        "/run-lammps/",
        json={"input_content": input_content}
    )
    
    # Check the response
    assert response.status_code == 200
    result = response.json()
    assert "msd" in result
    assert "potential_energy" in result
    assert len(result["msd"]) > 0
    assert len(result["potential_energy"]) > 0

def test_run_lammps_with_invalid_input():
    """Test running a LAMMPS simulation with invalid input."""
    # Prepare invalid test data
    input_content = """
    # Invalid LAMMPS input
    invalid_command
    """
    
    # Run the test
    response = client.post(
        "/run-lammps/",
        json={"input_content": input_content}
    )
    
    # Check the response
    assert response.status_code == 400
    assert "error" in response.json()

def test_generate_lammps_input():
    """Test generating LAMMPS input."""
    # Prepare test data
    parameters = {
        "temperature": 300,
        "timestep": 0.001,
        "run_steps": 1000
    }
    
    # Run the test
    response = client.post(
        "/generate-input/",
        json=parameters
    )
    
    # Check the response
    assert response.status_code == 200
    result = response.json()
    assert "input_content" in result
    assert "temperature" in result["input_content"]
    assert "timestep" in result["input_content"]
    assert "run" in result["input_content"] 