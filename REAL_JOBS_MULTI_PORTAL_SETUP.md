# Multi-Portal Job Integration Setup Guide

This guide explains how to set up real job data from ALL major job portals including LinkedIn, Indeed, Glassdoor, Dice, ZipRecruiter, and more.

## 🎯 Overview

Our job automation platform aggregates jobs from:
- **LinkedIn** - Professional networking and career platform
- **Indeed** - World's largest job search engine
- **Glassdoor** - Company reviews and salary insights
- **Dice** - Technology and IT jobs
- **ZipRecruiter** - General job marketplace
- **JSearch** - Comprehensive job search API
- **Adzuna** - Job aggregation service

## 🔑 API Keys Setup

### 1. LinkedIn Jobs (via RapidAPI)
```bash
# Sign up at rapidapi.com and subscribe to LinkedIn Jobs Search
REACT_APP_LINKEDIN_RAPID_API_KEY=your_linkedin_rapidapi_key
```
- **Service**: LinkedIn Jobs Search on RapidAPI
- **URL**: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-jobs-search
- **Free Tier**: 100 requests/month
- **Pricing**: $10/month for 1000 requests

### 2. Indeed Jobs (via RapidAPI)
```bash
# Subscribe to Indeed Jobs API on RapidAPI
REACT_APP_INDEED_RAPID_API_KEY=your_indeed_rapidapi_key
```
- **Service**: Indeed Jobs API on RapidAPI
- **URL**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/indeed12
- **Free Tier**: 100 requests/month
- **Pricing**: $15/month for 1000 requests

### 3. Glassdoor Jobs (via RapidAPI)
```bash
# Subscribe to Glassdoor Jobs Scraper on RapidAPI
REACT_APP_GLASSDOOR_RAPID_API_KEY=your_glassdoor_rapidapi_key
```
- **Service**: Glassdoor Jobs Scraper on RapidAPI
- **URL**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/glassdoor-jobs-scraper
- **Free Tier**: 100 requests/month
- **Pricing**: $12/month for 1000 requests

### 4. Dice Jobs (via RapidAPI)
```bash
# Subscribe to Dice Jobs API on RapidAPI
REACT_APP_DICE_RAPID_API_KEY=your_dice_rapidapi_key
```
- **Service**: Dice Jobs API on RapidAPI
- **URL**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/dice-com
- **Free Tier**: 50 requests/month
- **Pricing**: $20/month for 1000 requests

### 5. ZipRecruiter Jobs (via RapidAPI)
```bash
# Subscribe to ZipRecruiter Jobs API on RapidAPI
REACT_APP_ZIPRECRUITER_RAPID_API_KEY=your_ziprecruiter_rapidapi_key
```
- **Service**: ZipRecruiter Jobs Search on RapidAPI
- **URL**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/ziprecruiter-jobs-search
- **Free Tier**: 100 requests/month
- **Pricing**: $10/month for 1000 requests

### 6. JSearch (Comprehensive API)
```bash
# JSearch provides jobs from multiple sources
REACT_APP_RAPID_API_KEY=your_jsearch_rapidapi_key
```
- **Service**: JSearch on RapidAPI
- **URL**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
- **Free Tier**: 250 requests/month
- **Pricing**: $30/month for 2500 requests

### 7. Adzuna Jobs API
```bash
# Free tier available - sign up at developer.adzuna.com
REACT_APP_ADZUNA_APP_ID=your_adzuna_app_id
REACT_APP_ADZUNA_APP_KEY=your_adzuna_app_key
```
- **Service**: Adzuna Jobs API
- **URL**: https://developer.adzuna.com/
- **Free Tier**: 1000 requests/month
- **Pricing**: Free for non-commercial use

## 🚀 Complete .env Configuration

Create a `.env` file in your frontend directory:

```bash
# Multi-Portal Job API Configuration

# LinkedIn Jobs
REACT_APP_LINKEDIN_RAPID_API_KEY=your_linkedin_rapidapi_key

# Indeed Jobs  
REACT_APP_INDEED_RAPID_API_KEY=your_indeed_rapidapi_key

# Glassdoor Jobs
REACT_APP_GLASSDOOR_RAPID_API_KEY=your_glassdoor_rapidapi_key

# Dice Jobs
REACT_APP_DICE_RAPID_API_KEY=your_dice_rapidapi_key

# ZipRecruiter Jobs
REACT_APP_ZIPRECRUITER_RAPID_API_KEY=your_ziprecruiter_rapidapi_key

# JSearch (Comprehensive)
REACT_APP_RAPID_API_KEY=your_jsearch_rapidapi_key

# Adzuna Jobs (Free)
REACT_APP_ADZUNA_APP_ID=your_adzuna_app_id
REACT_APP_ADZUNA_APP_KEY=your_adzuna_app_key
```

## 💰 Cost Breakdown

### Recommended Starter Plan ($67/month)
- LinkedIn Jobs: $10/month (1000 requests)
- Indeed Jobs: $15/month (1000 requests)
- Glassdoor Jobs: $12/month (1000 requests)
- JSearch: $30/month (2500 requests)
- Adzuna: FREE (1000 requests)

**Total**: ~7,500 job searches per month

### Enterprise Plan ($150/month)
- All APIs at higher tiers
- 15,000+ job searches per month
- Priority support

## 🔧 Features Enabled

When you configure real API keys, you get:

✅ **Real Job Data** from all major portals
✅ **Direct Application Links** to specific job postings
✅ **Company Information** and logos
✅ **Salary Information** where available
✅ **Remote Work Filters**
✅ **Real-time Job Updates**
✅ **Advanced Search Filters**
✅ **Job Portal Source Attribution**

## 🎨 Demo vs Production Mode

### Demo Mode (No API Keys)
- Shows 6 realistic demo jobs
- Demonstrates UI/UX
- Perfect for development and testing
- No costs involved

### Production Mode (With API Keys)
- Live jobs from all major portals
- Real application URLs
- Up-to-date job listings
- Production-ready for paying users

## 🚦 Quick Start

1. **Development**: Start with demo mode to see the interface
2. **Testing**: Add Adzuna API keys (free) for real data testing
3. **Production**: Add all API keys for comprehensive job coverage

## 🔍 Job Portal Features

### LinkedIn
- Professional network jobs
- Easy Apply feature
- Company insights
- Salary ranges

### Indeed
- Largest job database
- Company reviews
- Salary information
- Application tracking

### Glassdoor
- Company ratings
- Salary transparency
- Interview experiences
- Work culture insights

### Dice
- Technology-focused
- Contract and full-time roles
- Skill-based matching
- IT and engineering jobs

### ZipRecruiter
- Fast applications
- Mobile-optimized
- Local job focus
- Small to medium businesses

## 🛠️ Implementation Notes

1. **Rate Limiting**: Implement proper caching to stay within API limits
2. **Error Handling**: Graceful fallbacks when APIs are unavailable
3. **Cost Management**: Monitor usage and implement request optimization
4. **User Experience**: Show job source attribution for transparency

## 📞 Support

For production setup assistance:
- Check API documentation for each service
- Monitor usage in RapidAPI dashboard
- Implement proper error handling
- Set up monitoring and alerts

---

**Ready to transform your job search experience with real data from ALL major job portals!** 🚀
