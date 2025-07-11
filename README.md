# Job Automation AI

An intelligent job automation system that scrapes jobs from multiple platforms, matches them to user profiles using AI, and automatically applies to suitable positions.

## Features

### 🤖 **Intelligent Job Matching**
- AI-powered job recommendation engine using OpenAI GPT
- Semantic analysis of job descriptions and user profiles
- Customizable matching criteria and preferences
- Real-time match scoring and ranking

### 🕷️ **Multi-Platform Job Scraping**
- **Indeed**: Real-time job scraping with advanced filters
- **Dice**: Technology-focused job aggregation
- **RemoteOK**: Remote work opportunities
- **LinkedIn**: Professional network integration (planned)
- **Glassdoor**: Company insights and reviews (planned)

### 🚀 **Automated Job Applications**
- Selenium-based form automation
- Platform-specific application logic
- Resume and cover letter auto-submission
- Application tracking and status monitoring

### 📄 **Smart Document Management**
- AI-powered resume parsing and optimization
- Dynamic cover letter generation
- Multiple resume versions for different job types
- Document storage and version control

### 👤 **User Profile Management**
- Comprehensive skill and experience tracking
- Preference settings for job types and locations
- Career goal alignment and progression tracking
- Authentication and secure data storage

### 🎨 **Modern UI/UX**
- Responsive React-based frontend
- Interactive animated mentors for guidance
- Real-time application status dashboard
- Intuitive job browsing and filtering

## Tech Stack

### Backend
- **Python 3.11+** - Core application logic
- **FastAPI** - REST API framework
- **SQLAlchemy** - Database ORM
- **Alembic** - Database migrations
- **OpenAI API** - AI-powered matching and content generation
- **Selenium & Playwright** - Web automation
- **BeautifulSoup & aiohttp** - Web scraping
- **SQLite** - Database (easily upgradeable to PostgreSQL)

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first styling
- **Lottie React** - Animations and micro-interactions
- **Axios** - HTTP client
- **React Router** - Navigation and routing

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Nginx** - Reverse proxy and static file serving
- **Environment-based configuration** - Development/Production settings

## Getting Started

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/job-automation-ai.git
   cd job-automation-ai
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   
   # Initialize database
   alembic upgrade head
   
   # Start the backend server
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create environment file
   cp .env.example .env.local
   # Edit .env.local if needed
   
   # Start the development server
   npm run dev
   ```

4. **Docker Setup (Alternative)**
   ```bash
   # Build and run with Docker Compose
   docker-compose up --build
   ```

### Configuration

#### Environment Variables

**Backend (.env)**
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./job_automation.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env.local)**
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Job Automation AI
```

## Usage

### 1. **User Registration & Setup**
- Create an account and verify your email
- Complete your profile with skills, experience, and preferences
- Upload your resume(s) for automatic parsing

### 2. **Job Discovery**
- Browse jobs from multiple platforms in one place
- Use AI-powered filtering and matching
- Save interesting positions for later review

### 3. **Automated Applications**
- Configure application preferences and requirements
- Enable auto-apply for highly matched positions
- Monitor application status and responses

### 4. **Cover Letter Generation**
- AI-generated personalized cover letters
- Template customization and editing
- Version control for different job types

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │  Job Platforms  │
│                 │    │                 │    │                 │
│ • User Interface│◄──►│ • REST API      │◄──►│ • Indeed       │
│ • Job Dashboard │    │ • Authentication│    │ • Dice         │
│ • Profile Mgmt  │    │ • Job Matching  │    │ • RemoteOK     │
│ • Applications  │    │ • Auto Apply    │    │ • LinkedIn     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │                 │
                       │ • Users         │
                       │ • Jobs          │
                       │ • Applications  │
                       │ • Resumes       │
                       └─────────────────┘
```

## Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test
```

### Code Quality
```bash
# Backend linting
cd backend
black . && flake8 .

# Frontend linting
cd frontend
npm run lint
npm run type-check
```

## Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up --build -d
```

### Environment Setup
- Set up production environment variables
- Configure SSL/TLS certificates
- Set up monitoring and logging
- Configure backup strategies

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Legal & Compliance

⚠️ **Important Notice**: This tool automates job applications and web scraping. Please ensure compliance with:

- **Terms of Service** of job platforms
- **Rate limiting** and respectful scraping practices
- **Data privacy** regulations (GDPR, CCPA, etc.)
- **Employment law** in your jurisdiction

Users are responsible for ensuring their use of this tool complies with all applicable laws and platform terms.

## Roadmap

### Phase 1 (Current)
- [x] Basic job scraping (Indeed, Dice, RemoteOK)
- [x] AI-powered job matching
- [x] Automated application system
- [x] User profile management
- [x] Cover letter generation

### Phase 2 (Planned)
- [ ] LinkedIn integration with OAuth
- [ ] Glassdoor company insights
- [ ] Advanced application tracking
- [ ] Email integration for notifications
- [ ] Mobile app development

### Phase 3 (Future)
- [ ] Machine learning job success prediction
- [ ] Salary negotiation assistance
- [ ] Interview scheduling automation
- [ ] Career progression planning
- [ ] Enterprise team features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 **Email**: support@job-automation-ai.com
- 💬 **Discord**: [Join our community](https://discord.gg/job-automation-ai)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/job-automation-ai/issues)
- 📖 **Documentation**: [Full Documentation](https://docs.job-automation-ai.com)

---

**Made with ❤️ for job seekers everywhere**
