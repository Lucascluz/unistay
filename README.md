# UniStay 🏠

A platform for students to share and discover accommodation reviews for study abroad destinations. Built with transparency and trust in mind, UniStay helps students make informed decisions about where to stay during their studies.

## ✨ Features

- 📝 **Student Reviews**: Share detailed accommodation reviews with ratings
- 🏢 **Company Profiles**: Verified accommodation providers can respond to reviews
- 🔍 **Smart Search**: Find accommodations by location with alias support (handles misspellings)
- 🎯 **Trust Score System**: Transparent scoring based on profile completion and verification
- 📧 **Email Verification**: Secure account verification system
- 👥 **Admin Dashboard**: Manage aliases, companies, and content moderation
- 🔒 **Secure Authentication**: JWT-based auth with bcrypt password hashing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lucascluz/startup.git
   cd startup
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pnpm install
   
   # Copy environment file and configure
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start PostgreSQL database
   docker-compose up -d
   
   # Run all migrations (single command!)
   pnpm migrate
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   pnpm install
   
   # Copy environment file and configure
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

4. **Start the development servers**
   
   Backend (from `backend/` directory):
   ```bash
   pnpm run dev
   ```
   
   Frontend (from `frontend/` directory):
   ```bash
   pnpm run dev
   ```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## 📁 Project Structure

```
unistay/
├── backend/              # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth & validation
│   │   ├── db/          # Database config
│   │   └── utils/       # JWT, email, trust score
│   ├── migrations/      # SQL migrations
│   └── scripts/         # Migration runners
│
├── frontend/            # React + React Router + TypeScript
│   ├── app/
│   │   ├── routes/      # Page components
│   │   ├── components/  # Reusable UI components
│   │   └── lib/         # API client & hooks
│   └── public/          # Static assets
│
└── docs/                # Additional documentation
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://studystay:studystay123@localhost:5432/studystay

# JWT (Generate strong random keys for production)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (Resend API)
RESEND=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173

# Admin
ADMIN_SECRET_KEY=your-admin-secret-key-change-in-production
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🗄️ Database

The project uses PostgreSQL with the following main tables:
- `users` - Student accounts
- `companies` - Accommodation provider accounts  
- `company_representatives` - Company team members
- `reviews` - Student accommodation reviews
- `review_responses` - Company responses to reviews
- `company_aliases` - Alternative names/spellings for companies
- `alias_suggestions` - User-submitted alias suggestions

### Running Migrations

The migration system automatically tracks which migrations have been run and only executes new ones:

```bash
cd backend
pnpm migrate
```

This will:
- Test database connection
- Check which migrations are pending
- Run only new migrations
- Track execution in the database

See [backend/MIGRATIONS.md](./backend/MIGRATIONS.md) for details.

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register       # Register student
POST /api/auth/login          # Login student
POST /api/auth/resend-verification  # Resend verification email
GET  /api/auth/verify-email   # Verify email (from link)
```

### Reviews Endpoints

```
GET  /api/reviews             # Get all reviews (with filters)
POST /api/reviews             # Create review (auth required)
GET  /api/reviews/:location   # Get reviews by location
POST /api/reviews/:id/helpful # Mark review as helpful
```

### Company Endpoints

```
POST /api/companies/register           # Register company
POST /api/companies/login              # Login company
GET  /api/companies/profile            # Get company profile
PUT  /api/companies/profile            # Update company profile
POST /api/companies/representatives    # Add team member
GET  /api/companies/reviews            # Get company's reviews
POST /api/companies/reviews/:id/respond # Respond to review
```

### Admin Endpoints

```
GET  /api/admin/aliases                # List aliases
POST /api/admin/aliases                # Create alias
PUT  /api/admin/aliases/:id            # Update alias
DELETE /api/admin/aliases/:id          # Delete alias
GET  /api/admin/aliases/suggestions    # Get suggestions
POST /api/admin/aliases/suggestions/:id/approve  # Approve
POST /api/admin/aliases/suggestions/:id/reject   # Reject
```

See [Backend README](./backend/README.md) for detailed API documentation.

## 🚢 Deployment

### Deploy to Render

#### Backend

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Add PostgreSQL Database** from Render dashboard
4. Set environment variables:
   ```
   DATABASE_URL=<from Render PostgreSQL>
   JWT_SECRET=<generate strong random key>
   ADMIN_SECRET_KEY=<generate strong random key>
   RESEND=<your Resend API key>
   FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=<your frontend URL>
   NODE_ENV=production
   ```
5. After deployment, run migrations via Render Shell:
   ```bash
   cd /opt/render/project/src/backend
   pnpm migrate
   ```
   
   The migration system automatically runs all pending migrations.

For detailed step-by-step instructions, see [RENDER_CONFIG.md](./RENDER_CONFIG.md).

#### Frontend

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
4. Set environment variable:
   ```
   VITE_API_URL=<your backend URL>/api
   ```

### Using Docker

Both frontend and backend include Dockerfiles:

```bash
# Backend
cd backend
docker build -t unistay-backend .
docker run -p 3001:3001 --env-file .env unistay-backend

# Frontend
cd frontend
docker build -t unistay-frontend .
docker run -p 3000:3000 unistay-frontend
```

## 🛡️ Security

- ✅ `.env` files are in `.gitignore` - never commit secrets
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with configurable expiration
- ✅ Email verification for accounts
- ✅ SQL injection protection via parameterized queries
- ✅ CORS configured for frontend origin

### Important Security Notes

- **Never commit `.env` files** - They contain sensitive credentials
- **Rotate secrets regularly** in production
- **Use strong random keys** for JWT_SECRET and ADMIN_SECRET_KEY
- **Keep dependencies updated** - Run `pnpm audit` regularly
- **Use HTTPS** in production
- **Rotate your Resend API key** if this repo was ever public with the key exposed

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built with [React Router](https://reactrouter.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Email delivery via [Resend](https://resend.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/backend/README.md` and `/frontend/README.md`

---

Built with ❤️ for students, by students.
