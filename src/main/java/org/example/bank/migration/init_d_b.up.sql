-- ============================
-- USERS
-- ============================
CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'OWNER', 'CARRIER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ============================
-- CARGO OWNERS (грузовладельцы)
-- ============================
CREATE TABLE IF NOT EXISTS owners (
                                      id BIGSERIAL PRIMARY KEY,
                                      user_id BIGINT NOT NULL,
                                      full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- ============================
-- CARRIERS (перевозчики)
-- ============================
CREATE TABLE IF NOT EXISTS carriers (
                                        id BIGSERIAL PRIMARY KEY,
                                        user_id BIGINT NOT NULL,
                                        company_name VARCHAR(255),
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- ============================
-- CARGO (ГРУЗЫ)
-- ============================
CREATE TABLE IF NOT EXISTS cargo (
                                     id BIGSERIAL PRIMARY KEY,
                                     owner_id BIGINT NOT NULL,
                                     name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

-- ============================
-- CARGO LOCATION
-- ============================
CREATE TABLE IF NOT EXISTS cargo_locations (
                                               id BIGSERIAL PRIMARY KEY,
                                               cargo_id BIGINT NOT NULL,
                                               latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    address VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE CASCADE
    );

-- ============================
-- TRANSPORTS
-- ============================
CREATE TABLE IF NOT EXISTS transports (
                                          id BIGSERIAL PRIMARY KEY,
                                          carrier_id BIGINT NOT NULL,
                                          type VARCHAR(255),
    number_plate VARCHAR(50) UNIQUE,
    capacity DECIMAL(10,2),
    FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE
    );

-- ============================
-- ROUTES (маршруты)
-- ============================
CREATE TABLE IF NOT EXISTS routes (
                                      id BIGSERIAL PRIMARY KEY,
                                      cargo_id BIGINT NOT NULL,
                                      start_address VARCHAR(255),
    end_address VARCHAR(255),
    start_lat DECIMAL(10,7),
    start_lng DECIMAL(10,7),
    end_lat DECIMAL(10,7),
    end_lng DECIMAL(10,7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE CASCADE
    );

-- ============================
-- REQUESTS (заявки)
-- ============================
CREATE TABLE IF NOT EXISTS requests (
                                        id BIGSERIAL PRIMARY KEY,
                                        cargo_id BIGINT NOT NULL,
                                        owner_id BIGINT NOT NULL,
                                        carrier_id BIGINT,
                                        status VARCHAR(20) NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
    pickup_date DATE,
    delivery_date DATE,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargo(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (carrier_id) REFERENCES carriers(id)
    );

-- ============================
-- REVIEWS
-- ============================
CREATE TABLE IF NOT EXISTS reviews (
                                       id BIGSERIAL PRIMARY KEY,
                                       owner_id BIGINT NOT NULL,
                                       carrier_id BIGINT NOT NULL,
                                       rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE
    );

-- ============================
-- EXCEL EXPORT LOG
-- ============================
CREATE TABLE IF NOT EXISTS export_logs (
                                           id BIGSERIAL PRIMARY KEY,
                                           user_id BIGINT NOT NULL,
                                           type VARCHAR(20) NOT NULL
    CHECK (type IN ('CARGO', 'TRANSPORT', 'ROUTE', 'REQUESTS')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- ============================
-- ANALYTICS
-- ============================
CREATE TABLE IF NOT EXISTS analytics (
                                         id BIGSERIAL PRIMARY KEY,
                                         metric VARCHAR(255) NOT NULL,
    value DECIMAL(20,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
