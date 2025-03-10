import pytest
from fastapi.testclient import TestClient
import json
import os
from pathlib import Path
import tempfile

from app.main import app
from app.services.lammps_service import LAMMPSService
from app.services.ase_service import ASEService

client = TestClient(app)

@pytest.fixture
def sample_input_content():
    """Fixture providing a simple LAMMPS input file."""
    return """
    # Simple Lennard-Jones simulation of argon
    units           lj
    atom_style      atomic
    boundary        p p p
    
    # Create simulation box and atoms
    lattice         fcc 0.8442
    region          box block 0 3 0 3 0 3
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
    
    # Run simulation (short for testing)
    dump            1 all xyz 10 simulation.xyz
    thermo          10
    thermo_style    custom step temp pe ke etotal
    timestep        0.005
    run             100
    """

def test_end_to_end_pipeline():
    """Test the complete end-to-end pipeline."""
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

    # Run the simulation
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

def test_health_check_integration():
    """Test the health check endpoint in an integration context."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"} 