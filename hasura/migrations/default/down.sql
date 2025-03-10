-- Drop triggers
DROP TRIGGER IF EXISTS set_simulations_updated_at ON simulations;
DROP TRIGGER IF EXISTS set_simulation_inputs_updated_at ON simulation_inputs;
DROP TRIGGER IF EXISTS set_potential_files_updated_at ON potential_files;
DROP TRIGGER IF EXISTS set_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS set_updated_at();

-- Drop tables
DROP TABLE IF EXISTS simulations;
DROP TABLE IF EXISTS simulation_inputs;
DROP TABLE IF EXISTS potential_files;
DROP TABLE IF EXISTS users; 