# AI Job Scraper

A powerful, AI-driven job aggregation platform that scrapes and matches job opportunities from multiple sources.

## 🌟 Features

### Core Functionality
- ✅ **Multi-Source Job Scraping**: Aggregates jobs from LinkedIn, Indeed, Glassdoor, and Naukri
- ✅ **AI-Powered Resume Matching**: Upload your resume for intelligent job recommendations
- ✅ **Smart Filtering**: Filter by location, job type, salary, remote options, and more
- ✅ **Real-Time Updates**: Jobs sorted newest to oldest with automatic filtering of expired listings
- ✅ **Source Badges**: Each job clearly shows its source platform
- ✅ **Sticky Filter Panel**: Easy access to filters while browsing

### Technical Features
- ✅ **Lightweight AI Model**: Uses `Xenova/all-MiniLM-L6-v2` for efficient embedding generation
- ✅ **Vector Similarity Search**: Matches jobs to your resume using pgvector
- ✅ **URL Validation**: Automatically filters out broken/obfuscated job links
- ✅ **Date Filtering**: Shows only recent jobs (last 30 days by default)
- ✅ **Professional UI**: Clean, modern interface with custom scrollbars and animations

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Database Client**: Supabase
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Queue System**: BullMQ with Redis
- **AI/ML**: @xenova/transformers
- **Database**: Supabase (PostgreSQL + pgvector)
- **Web Scraping**: Playwright

### Job Sources
1. **LinkedIn** - Professional networking platform
2. **Indeed** - Global job search engine
3. **Glassdoor** - Company reviews and jobs
4. **Naukri** - India's leading job portal

## 📦 Installation

### Prerequisites
- Node.js 18+
- Redis 6.2+
- Supabase account

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Job\ Scrapper
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. **Configure environment variables**

Frontend (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379
```

Backend (`.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379
```

4. **Run database migrations**
```bash
cd backend/migrations
# Execute SQL files in Supabase SQL editor
```

5. **Start the application**
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

## 🎯 Usage

1. **Browse Jobs**: Visit `http://localhost:3001` to see available jobs
2. **Upload Resume**: Click "Upload Resume" to get AI-powered job recommendations
3. **Filter Jobs**: Use the sticky filter panel to refine your search
4. **Apply**: Click "Apply Now" on any job card to visit the original posting

## 🔧 Configuration

### Scraper Settings
- Default job age limit: 30 days
- Bulk scraper: 25 diverse search queries
- Sources: All 4 platforms enabled by default

### AI Model
- Model: `Xenova/all-MiniLM-L6-v2`
- Embedding dimension: 384
- Similarity threshold: 0.75 for match badges

## 📊 Database Schema

### Main Tables
- `jobs`: Job listings with embeddings
- `resumes`: User resumes with embeddings
- `job_sources`: Configured job platforms

### Key Functions
- `match_jobs_for_user`: Vector similarity search for job matching

## 🎨 UI Features

- **Professional Design**: Clean white cards with subtle shadows
- **Color-Coded Sources**: 
  - 🔵 LinkedIn (Blue)
  - 🟢 Indeed (Green)
  - 🟣 Naukri (Purple)
  - 🔷 Glassdoor (Teal)
- **Custom Scrollbars**: Gradient indigo/purple scrollbars
- **Responsive Layout**: Works on desktop and mobile

## 🚧 Known Limitations

- Redis version 5.0.14 (recommended: 6.2.0+)
- Some job platforms may block scraping attempts
- LinkedIn uses obfuscated URLs (automatically filtered)

## 🔮 Future Enhancements

- [ ] User authentication
- [ ] Save favorite jobs
- [ ] Email job alerts
- [ ] More job sources (Monster, Shine, etc.)
- [ ] Advanced AI features (job description summarization)
- [ ] Job application tracking

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
