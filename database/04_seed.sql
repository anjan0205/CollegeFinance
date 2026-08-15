-- ============================================================================
-- College Budget & PR Management System
-- Initial Seed Data
-- File: 04_seed.sql
-- ============================================================================

-- Insert Default Admin & Finance Users
-- Note: Password hashes correspond to 'Admin@123' and 'Finance@123'
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('ADMIN', 'Administration', 'Administrative');
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('FINANCE', 'Finance Office', 'Administrative');
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('CSE', 'Computer Science & Engineering', 'Academic');
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('ECE', 'Electronics & Communication Engineering', 'Academic');
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('EEE', 'Electrical & Electronics Engineering', 'Academic');
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('ME', 'Mechanical Engineering', 'Academic');
INSERT INTO DEPARTMENTS (code, name, category) VALUES ('CE', 'Civil Engineering', 'Academic');

-- Users
INSERT INTO USERS (name, email, password_hash, role, department_id) 
VALUES ('System Admin', 'admin@vignan.ac.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVym507x8z5S8d5Y9v2wzL8G', 'ADMIN', 1);

INSERT INTO USERS (name, email, password_hash, role, department_id) 
VALUES ('Finance Manager', 'finance@vignan.ac.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVym507x8z5S8d5Y9v2wzL8G', 'FINANCE', 2);

INSERT INTO USERS (name, email, password_hash, role, department_id) 
VALUES ('Dr. CSE HOD', 'hod.cse@vignan.ac.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVym507x8z5S8d5Y9v2wzL8G', 'HOD', 3);

INSERT INTO USERS (name, email, password_hash, role, department_id) 
VALUES ('Dr. ECE HOD', 'hod.ece@vignan.ac.in', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVym507x8z5S8d5Y9v2wzL8G', 'HOD', 4);

COMMIT;
