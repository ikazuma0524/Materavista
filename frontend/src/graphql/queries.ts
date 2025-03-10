import { gql } from '@apollo/client';

// Get all potential files for the current user
export const GET_POTENTIAL_FILES = gql`
  query GetPotentialFiles {
    potential_files {
      id
      filename
      created_at
    }
  }
`;

// Get a specific potential file by ID
export const GET_POTENTIAL_FILE = gql`
  query GetPotentialFile($id: uuid!) {
    potential_files_by_pk(id: $id) {
      id
      filename
      content
      file_path
      created_at
    }
  }
`;

// Get all simulation inputs for the current user
export const GET_SIMULATION_INPUTS = gql`
  query GetSimulationInputs {
    simulation_inputs {
      id
      name
      created_at
      potential_file {
        id
        filename
      }
    }
  }
`;

// Get a specific simulation input by ID
export const GET_SIMULATION_INPUT = gql`
  query GetSimulationInput($id: uuid!) {
    simulation_inputs_by_pk(id: $id) {
      id
      name
      content
      created_at
      potential_file {
        id
        filename
      }
    }
  }
`;

// Get all simulations for the current user
export const GET_SIMULATIONS = gql`
  query GetSimulations {
    simulations {
      id
      status
      created_at
      frames
      atoms
      input {
        id
        name
      }
    }
  }
`;

// Get a specific simulation by ID
export const GET_SIMULATION = gql`
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
`; 