# Food Supply Management System

## Overview

A comprehensive web-based food supply chain management system built with Flask and MySQL. The application manages the entire supply chain workflow from suppliers to customers, including product inventory, warehouse facilities, distributor networks, and order processing. Features include secure user authentication, real-time dashboard metrics, CRUD operations for all entities, and a responsive modern UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Template Engine**: Jinja2 with server-side rendering
- Base template inheritance pattern for consistent UI across all pages
- Shared sidebar component for navigation
- Modal-based forms for CRUD operations

**UI Framework**: Tailwind CSS with Font Awesome icons
- Utility-first CSS approach for responsive design
- Custom CSS for animations and scrollbar styling
- Component-based design with reusable modal patterns

**Client-Side JavaScript**:
- Vanilla JavaScript for DOM manipulation and API calls
- Fetch API for asynchronous server communication
- Toast notification system for user feedback
- Auto-refresh dashboard stats (30-second intervals)

### Backend Architecture

**Web Framework**: Flask 3.0.0
- Session-based authentication using Flask sessions
- Decorator pattern for route protection (`@login_required`)
- RESTful API endpoints for CRUD operations
- CORS enabled for cross-origin requests

**Authentication & Security**:
- Werkzeug password hashing for secure credential storage
- Session-based user authentication (no JWT/tokens)
- Secret key configuration via environment variables
- Login decorator enforces authentication on protected routes

**Database Layer**:
- Direct MySQL connector (no ORM)
- Connection pooling through `get_db_connection()` helper
- Environment-based configuration for database credentials
- Auto-increment primary keys for all entities

**Data Models** (MySQL tables):
- Users: Authentication and user profiles
- Suppliers: Vendor management with contact information
- Products: Inventory with pricing, stock, and supplier relationships
- Warehouses: Storage facilities with capacity and location
- Distributors: Distribution network with regional assignments
- Customers: Customer database with contact details
- Orders: Transaction records linking customers and products

### Key Design Patterns

**Template Inheritance**:
- Single `base.html` template provides consistent layout
- Child templates extend base and override content blocks
- Sidebar extracted as reusable include component

**Session Management**:
- Server-side sessions for user state
- Session data stored in Flask's secure cookie
- Logout clears session and redirects to login

**Error Handling**:
- Database connection errors caught and logged
- Toast notifications provide user-friendly error messages
- Graceful degradation when API calls fail

**Code Organization**:
- Route handlers in main `app.py`
- Static assets organized by type (CSS, JS)
- Templates follow feature-based naming convention
- Setup scripts separated from application code

## External Dependencies

### Database

**MySQL Server**:
- Relational database for all application data
- Configuration via environment variables (host, port, user, password, database name)
- Connection requires external MySQL instance or service
- Currently configured for localhost but supports remote connections

**Note**: The application is designed for MySQL but could be adapted to PostgreSQL with minimal changes to connection logic and SQL syntax.

### Python Packages

- **Flask 3.0.0**: Web framework and routing
- **flask-cors 4.0.0**: Cross-Origin Resource Sharing support
- **mysql-connector-python 8.2.0**: MySQL database driver
- **python-dotenv 1.0.0**: Environment variable management
- **werkzeug 3.0.1**: Password hashing and security utilities

### Frontend CDN Dependencies

- **Tailwind CSS**: Loaded via CDN for styling
- **Font Awesome 6.4.0**: Icon library via CDN

### Environment Configuration

Required environment variables (stored in Replit Secrets):
- `MYSQL_HOST`: Database server hostname
- `MYSQL_USER`: Database username
- `MYSQL_PASSWORD`: Database password
- `MYSQL_DATABASE`: Database name (default: food_supply)
- `MYSQL_PORT`: Database port (default: 3306)
- `SECRET_KEY`: Flask session encryption key

### Deployment Platform

- Designed for Replit hosting environment
- Uses Replit Secrets for sensitive configuration
- Supports external MySQL hosting services