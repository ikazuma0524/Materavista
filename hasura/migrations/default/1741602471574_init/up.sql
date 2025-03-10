-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create potential_files table
CREATE TABLE potential_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create simulation_inputs table
CREATE TABLE simulation_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    content TEXT NOT NULL,
    potential_file_id UUID REFERENCES potential_files(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create simulations table
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending',
    input_id UUID NOT NULL REFERENCES simulation_inputs(id),
    trajectory_file_path TEXT,
    velocity_file_path TEXT,
    msd JSONB,
    kinetic_energy JSONB,
    frames INTEGER,
    atoms INTEGER,
    error TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_potential_files_updated_at
BEFORE UPDATE ON potential_files
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_simulation_inputs_updated_at
BEFORE UPDATE ON simulation_inputs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_simulations_updated_at
BEFORE UPDATE ON simulations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at(); 