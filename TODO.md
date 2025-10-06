# StudyStay Platform - TODO & Feature Tracking

## ✅ Completed Features

### 1. Company Alias System (Implemented!)
**Status**: Complete and ready to use  
**Documentation**: See ALIAS_README.md, ALIAS_QUICK_START.md, ALIAS_SYSTEM.md

**What it does**:
- Handles misspellings and different naming variations for organizations
- Allows multiple names to point to one official company
- Supports pre-registration aliases that can be linked later
- User suggestions with admin review workflow
- Smart search with aliases

**Files created**:
- `backend/migrations/002_company_aliases.sql`
- `backend/src/routes/admin-aliases.ts`
- `backend/src/routes/search.ts`
- `backend/src/types/aliases.ts`
- Complete documentation suite

**To activate**: Run `cd backend && pnpm run migrate:aliases`

---

## 🐛 Fixed Issues

### Profile Update & Trust Score Bug (Fixed!)
**Issue**: Profile data wasn't being saved and trust score wasn't updating  
**Cause**: camelCase/snake_case mismatch between frontend and backend  
**Fix**: Added proper field mapping in backend users route  
**Documentation**: PROFILE_UPDATE_FIX.md