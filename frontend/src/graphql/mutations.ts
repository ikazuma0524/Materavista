import { gql } from '@apollo/client';

// Create a new potential file
export const CREATE_POTENTIAL_FILE = gql`
  mutation CreatePotentialFile($filename: String!, $content: String!, $file_path: String!) {
    insert_potential_files_one(object: {
      filename: $filename,
      content: $content,
      file_path: $file_path
    }) {
      id
      filename
      created_at
    }
  }
`;

// Update a potential file
export const UPDATE_POTENTIAL_FILE = gql`
  mutation UpdatePotentialFile($id: uuid!, $filename: String!, $content: String!) {
    update_potential_files_by_pk(
      pk_columns: {id: $id},
      _set: {
        filename: $filename,
        content: $content
      }
    ) {
      id
      filename
      updated_at
    }
  }
`;

// Delete a potential file
export const DELETE_POTENTIAL_FILE = gql`
  mutation DeletePotentialFile($id: uuid!) {
    delete_potential_files_by_pk(id: $id) {
      id
    }
  }
`;

// Create a new simulation input
export const CREATE_SIMULATION_INPUT = gql`
  mutation CreateSimulationInput($name: String!, $content: String!, $potential_file_id: uuid) {
    insert_simulation_inputs_one(object: {
      name: $name,
      content: $content,
      potential_file_id: $potential_file_id
    }) {
      id
      name
      created_at
    }
  }
`;

// Update a simulation input
export const UPDATE_SIMULATION_INPUT = gql`
  mutation UpdateSimulationInput($id: uuid!, $name: String!, $content: String!, $potential_file_id: uuid) {
    update_simulation_inputs_by_pk(
      pk_columns: {id: $id},
      _set: {
        name: $name,
        content: $content,
        potential_file_id: $potential_file_id
      }
    ) {
      id
      name
      updated_at
    }
  }
`;

// Delete a simulation input
export const DELETE_SIMULATION_INPUT = gql`
  mutation DeleteSimulationInput($id: uuid!) {
    delete_simulation_inputs_by_pk(id: $id) {
      id
    }
  }
`;

// Create a new simulation
export const CREATE_SIMULATION = gql`
  mutation CreateSimulation($input_id: uuid!) {
    insert_simulations_one(object: {
      input_id: $input_id,
      status: "pending"
    }) {
      id
      status
      created_at
    }
  }
`;

// Update a simulation status
export const UPDATE_SIMULATION_STATUS = gql`
  mutation UpdateSimulationStatus($id: uuid!, $status: String!) {
    update_simulations_by_pk(
      pk_columns: {id: $id},
      _set: {
        status: $status
      }
    ) {
      id
      status
      updated_at
    }
  }
`;

// Delete a simulation
export const DELETE_SIMULATION = gql`
  mutation DeleteSimulation($id: uuid!) {
    delete_simulations_by_pk(id: $id) {
      id
    }
  }
`; 