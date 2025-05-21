# GITEX Leads Standalone Application

A standalone application for collecting and managing GITEX event leads. This application allows you to capture leads with optional photos during events.

## Features

- Simple lead capture form with optional fields
- Photo upload capability (up to 5 photos per lead)
- Lead database with search functionality
- Fullscreen mobile-optimized interface
- Tecnarit branding

## Installation

1. Clone this repository:
```
git clone https://your-repository-url/gitex-leads-standalone.git
cd gitex-leads-standalone
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your database credentials:
```
# Server configuration
PORT=5050

# Database configuration
DATABASE_URL=postgres://username:password@hostname:5432/database_name

# Environment
NODE_ENV=development
```

4. Start the development server:
```
npm run dev
```

5. For production builds:
```
npm run build
npm start
```

## Database Setup

This application requires a PostgreSQL database. Make sure you have PostgreSQL installed and running. The application will automatically create the necessary `gitex_leads` table when it starts.

## Configuration

You can adjust configuration settings in the `.env` file:

- `PORT`: The port number for the server (default: 5050)
- `DATABASE_URL`: Your PostgreSQL database connection string
- `NODE_ENV`: Environment setting ('development' or 'production')

## Usage

1. Access the application in your browser at `http://localhost:5050`.
2. Use the "New Lead" tab to add leads with information and optional photos.
3. View and search existing leads in the "Database" tab.
4. Click on any lead in the database to view details and photos.

## Deployment

You can deploy this application to any hosting platform that supports Node.js:

1. Build the application:
```
npm run build
```

2. Deploy the resulting `dist` folder along with the server files.

### Recommended Deployment Platforms

- Vercel
- Netlify
- Heroku
- Railway
- DigitalOcean App Platform

## License

This application is licensed under the Tecnarit license terms.

## Contact

For support, please contact Tecnarit at your-email@tecnarit.com.