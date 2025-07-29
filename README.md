# Job Automation AI - Commercial Grade

🚀 **An enterprise-level intelligent job automation platform** that revolutionizes the job search experience with AI-powered matching, automated applications, and comprehensive analytics.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+ with virtual environment
- Node.js 18+
- npm or yarn

### Starting the Full Stack Application

**Option 1: Auto-Start Script (Recommended)**
```bash
# Start both backend and frontend servers
./start_full_stack.sh
```

**Option 2: Check Server Status**
```bash
# Check if servers are running correctly
./check_servers.sh
```

**Option 3: Manual Start**
```bash
# Backend (Terminal 1)
source .venv/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Application URLs
- **Frontend**: http://localhost:5173 (React/Vite)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🌟 Commercial Features

### 🎯 **AI-Powered Career Intelligence**
- **Smart Animal Mentors**: Personalized guidance from Eagle, Wolf, Fox, Dolphin, and Lion mentors
- **Predictive Analytics**: ML-driven success rate predictions and market insights
- **Skills Demand Analysis**: Real-time market analysis with salary impact projections
- **Career Path Optimization**: AI recommendations for skill development and job targeting

### 🔍 **Advanced Job Search & Filtering**
- **LinkedIn/Indeed-Style Interface**: Professional job portal experience with comprehensive filtering
- **Multi-Platform Search**: Unified search across LinkedIn, Indeed, Glassdoor, RemoteOK, Dice
- **Smart Filtering System**: Filter by platform, location, job type, salary range, experience level
- **Keyword Search**: Intelligent search with title, skills, and description matching
- **Sort Options**: Best Match, Most Recent, Highest Salary, Relevance sorting

### 🤖 **AI-Powered Resume Matching**
- **Skills Analysis**: Automatic extraction of required skills from job descriptions
- **Skills Matching**: Visual indicators showing which skills you have vs. required
- **Experience Matching**: Compares your experience level with job requirements
- **Title Matching**: Matches your past job titles with current opportunities
- **AI Match Score**: Comprehensive percentage based on multiple factors
- **Match Details Breakdown**: Shows title, skills, and experience match percentages

### 🚀 **Advanced Job Automation**
- **Multi-Platform Scraping**: Indeed, Dice, LinkedIn, Glassdoor, RemoteOK integration
- **Smart Auto-Applier**: Intelligent form filling with anti-detection measures
- **Adaptive Learning**: System learns from application outcomes to improve matching
- **Background Processing**: Celery-based task queue for scalable automation

### 📊 **Commercial Analytics Dashboard**
- **Real-time Performance Metrics**: Application success rates, response times, platform performance
- **Advanced Visualizations**: Interactive charts and trend analysis
- **Competitive Intelligence**: Market comparison and salary insights
- **ROI Tracking**: Time saved and application efficiency metrics

### 🛡️ **Enterprise Security & Reliability**
- **Credential Encryption**: Secure storage of job portal credentials
- **Anti-Detection**: Advanced evasion techniques for automation
- **Rate Limiting**: Intelligent request throttling and proxy rotation
- **Error Recovery**: Robust error handling and automatic retry mechanisms

### 📈 **Production Monitoring**
- **Prometheus Metrics**: Comprehensive application monitoring
- **Grafana Dashboards**: Real-time performance visualization
- **Health Checks**: Automated service monitoring and alerting
- **Log Aggregation**: Centralized logging with error tracking

## Features

### 🔍 **Professional Job Search Portal**
- **LinkedIn/Indeed-Style Interface**: Professional-grade job search experience
- **Comprehensive Filtering**: Platform, location, job type, salary range, experience level filters
- **Real-time Search**: Instant job filtering with intelligent keyword matching
- **Advanced Sorting**: Sort by match score, date, salary, or relevance
- **Filter Persistence**: Saved search preferences and applied filter tracking

### 🤖 **Intelligent Job Matching**
- **AI-powered job recommendation engine** using OpenAI GPT
- **Resume-based job prioritization** with skills and experience matching
- **Semantic analysis** of job descriptions and user profiles
- **Real-time match scoring** with detailed breakdown (title, skills, experience)
- **Personalized job ranking** based on your uploaded resume

### 🎨 **Enhanced Job Display**
- **Skills Visualization**: Required skills with checkmarks for matched ones
- **Match Analysis Panel**: Detailed breakdown of why a job matches your profile
- **Company & Location Info**: Complete job details with posting dates
- **Direct Apply Links**: One-click apply that opens original job posting
- **Bookmark Functionality**: Save jobs for later review

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

## 🗄️ Database Architecture

The application uses a robust database system designed for scalability and data integrity:

### **Database Technology**
- **Development**: SQLite (lightweight, file-based database)
- **Production**: Configurable via `DATABASE_URL` (PostgreSQL recommended)
- **ORM**: SQLAlchemy for object-relational mapping
- **Migrations**: Alembic for schema versioning and updates

### **Core Database Tables**

#### **Users Management**
- **`users`** - Core user information and authentication
  - Authentication: username, email, hashed_password
  - Profile: first_name, last_name, phone, linkedin_url
  - Professional: experience_years, certifications, education
  - Media: profile_picture_url

#### **Job Data & Applications**
- **`jobs`** - Scraped job listings from multiple platforms
  - Job details: title, company, location, description, salary
  - Platform tracking: source platform, URLs, posting dates
  - Metadata: job_type, raw scraped data (JSON)

- **`job_applications`** - Application tracking and status
  - Application lifecycle: status, success tracking, timestamps
  - Data storage: application_data (JSON), error messages
  - User linking: foreign key relationships to users and jobs

#### **Document Management**
- **`resumes`** - Resume storage and management
  - File management: S3 URLs, file sizes, upload timestamps
  - Content: parsed resume data (JSON format)
  - Organization: primary resume designation, user ownership

#### **Automation & Preferences**
- **`automation_settings`** - Job automation configuration
  - Limits: max applications per day, match thresholds
  - Preferences: enabled platforms, preferred locations
  - Filters: salary ranges, job types, keywords (include/exclude)
  - Scheduling: time windows, active days, automation status

- **`job_portal_credentials`** - Secure credential storage
  - Platform credentials: encrypted passwords for job sites
  - Security: additional OAuth data, activity tracking
  - Management: active status, last used timestamps

#### **User Interaction Data**
- **`questionnaire_answers`** - User preferences and responses
  - Question management: standardized keys, question text
  - Response data: user answers, question types
  - Versioning: creation and update timestamps

- **`enhanced_user_profiles`** - Extended profile information
  - Additional user data beyond core profile
  - Customizable fields for advanced features

### **Database Features**

#### **Security & Integrity**
- **Password Security**: Bcrypt hashing for all user passwords
- **Credential Encryption**: Job portal passwords encrypted at rest
- **Data Relationships**: Foreign key constraints ensure data integrity
- **Unique Constraints**: Prevent duplicate users and maintain data quality

#### **Performance Optimization**
- **Indexing**: Strategic indexes on frequently queried fields
- **Query Optimization**: SQLAlchemy ORM with efficient relationship loading
- **Connection Management**: Proper connection pooling and session handling

#### **Development Features**
- **Migration Support**: Alembic tracks and manages schema changes
- **Relationship Mapping**: SQLAlchemy relationships for easy data access
- **JSON Storage**: Flexible data storage for complex objects
- **Environment Configuration**: Easy database switching for different environments

### **Data Verification**
You can verify your data storage by checking the database directly:

```bash
# View all tables
sqlite3 test.db ".tables"

# Check your user data
sqlite3 test.db "SELECT id, username, email, first_name, last_name FROM users;"

# View database schema
sqlite3 test.db ".schema users"
```

### **Production Database Setup**
For production deployments, configure PostgreSQL:

```env
# Production database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/job_automation_db
```

The application automatically handles the database differences through SQLAlchemy's database abstraction layer.

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

## Deployment Options

### 🏢 Commercial-Grade Deployment (Recommended for Production)
```bash
# Full commercial deployment with monitoring, SSL, and optimization
chmod +x deploy.sh
./deploy.sh --commercial
```

**Features included:**
- ✅ Advanced monitoring stack (Prometheus + Grafana)
- ✅ SSL/TLS encryption with security headers
- ✅ Production-optimized Nginx configuration
- ✅ Rate limiting and DDoS protection
- ✅ Automated health checks
- ✅ Performance monitoring and alerting

**Access points:**
- **Application**: https://localhost (Main app)
- **Monitoring**: http://localhost:3001 (Grafana dashboard)
- **Metrics**: http://localhost:9090 (Prometheus)

### 📊 Deployment with Monitoring
```bash
# Standard deployment with enhanced monitoring
./deploy.sh --monitoring
```

### 🔧 Standard Deployment
```bash
# Basic production deployment
./deploy.sh
```

### 🚀 Development Deployment
```bash
# Quick development setup
docker-compose up --build
```

### Production Checklist

Before deploying to production:

1. **Environment Configuration**
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with your actual values:
   # - DB_PASSWORD (strong password)
   # - SECRET_KEY (generate new key)
   # - OPENAI_API_KEY (your API key)
   # - SMTP settings for email
   ```

2. **SSL Certificates**
   - For production, replace self-signed certificates with proper SSL certificates
   - Use Let's Encrypt or your certificate authority
   ```bash
   # Place certificates in nginx/ssl/
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

3. **Monitoring Setup**
   - Configure Grafana dashboards for your metrics
   - Set up alerting rules in Prometheus
   - Configure notification channels (Slack, email, etc.)

4. **Security Hardening**
   - Update default passwords
   - Configure firewall rules
   - Set up rate limiting
   - Enable audit logging

5. **Backup Strategy**
   ```bash
   # Database backups
   docker-compose exec postgres pg_dump -U jobai jobai_db > backup.sql

   # Volume backups
   docker run --rm -v job-automation-ai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
   ```

### Environment Variables

Key production environment variables:

```bash
# Database
DB_HOST=postgres
DB_NAME=jobai_db
DB_USER=jobai
DB_PASSWORD=your_secure_password

# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Redis
REDIS_URL=redis://redis:6379

# Application
ENVIRONMENT=production
DEBUG=false
```

### Scaling and Performance

For high-traffic scenarios:

1. **Horizontal Scaling**
   ```bash
   # Scale backend workers
   docker-compose -f docker-compose.prod.yml up --scale backend=3 -d

   # Scale Celery workers
   docker-compose -f docker-compose.prod.yml up --scale celery-worker=5 -d
   ```

2. **Database Optimization**
   - Configure PostgreSQL for production workloads
   - Set up read replicas for analytics queries
   - Implement connection pooling

3. **Caching Strategy**
   - Redis for session storage and job caching
   - CDN for static assets
   - Application-level caching for API responses

### Monitoring and Alerting

The commercial deployment includes comprehensive monitoring:

**Key Metrics Tracked:**
- Application response times
- Job application success rates
- Database performance
- System resource usage
- Error rates and types

**Available Dashboards:**
- Job Application Performance
- System Health Overview
- User Engagement Analytics
- Commercial ROI Metrics

**Alerting Rules:**
- High error rates (>5%)
- Database connection issues
- Memory usage >80%
- Disk space <20%

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
