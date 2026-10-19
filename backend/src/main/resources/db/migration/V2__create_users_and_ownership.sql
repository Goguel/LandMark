-- Flyway Migration V2: Create Users Table and Establish Plot Ownership
-- Enables user authentication and secure property management

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add foreign key constraint for plot ownership
ALTER TABLE land_plots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_land_plots_user_id ON land_plots(user_id);

-- Insert default system administrator (Email: admin@landmark.com | Password: Landmark@123)
INSERT INTO users (id, name, email, password, role, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Administrador LandMark',
    'admin@landmark.com',
    '$2a$10$rGugEUqNR99/kOqTlM48bOxJW0zW.BWo2rQtzJRTY.YsLQoCV661q',
    'ROLE_ADMIN',
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Associate existing unassigned plots to the default administrator
UPDATE land_plots SET user_id = 'a0000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
