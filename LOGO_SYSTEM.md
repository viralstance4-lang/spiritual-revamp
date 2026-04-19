# 🎨 Global Logo System — Complete Implementation

## System Overview

This is a **single-source-of-truth** logo system where:
- Admin uploads logo once → stored in MongoDB
- Logo + size fetched on app startup (Context)
- Logo displays everywhere with same size
- Changes emit instantly (no refresh needed)

---

## Architecture

### 1. **Backend Database Layer**

**Model:** `SiteSettings` (MongoDB)
```javascript
{
  logoUrl: String,      // Full URL from Cloudinary or /uploads
  logoWidth: String,    // CSS value: "120px", "100%", "auto"
  logoHeight: String,   // CSS value: "60px", "auto"
  logoAlt: String,      // "spiritual-revamp" for SEO
}
```

**Important:** Only **ONE** document exists (singleton pattern)
- Uses `findOneAndUpdate({}, data, { upsert: true })`

### 2. **Backend API**

#### GET `/api/settings`
- **Purpose:** Fetch logo + dimensions
- **Response:**
  ```json
  {
    "success": true,
    "settings": {
      "logoUrl": "https://res.cloudinary.com/.../logo.png",
      "logoWidth": "120px",
      "logoHeight": "auto",
      "logoAlt": "spiritual-revamp"
    }
  }
  ```

#### PUT `/api/settings/logo`
- **Purpose:** Upload new logo + update dimensions
- **Auth:** Admin only
- **Body:** FormData
  ```
  - logo (file)
  - logoWidth (string)
  - logoHeight (string)
  - logoAlt (string)
  ```
- **Response:** Updated settings object

### 3. **Frontend Context Layer**

**File:** `/frontend/src/context/SiteLogoContext.jsx`

```javascript
const { logoUrl, logoWidth, logoHeight, logoAlt, refetch } = useSiteLogo();
```

**Key Features:**
- Fetches on mount
- Provides `refetch()` function to update globally
- Error handling + loading state

**Admin Context:** `/admin/src/context/SiteLogoContext.jsx` (same)

### 4. **Display Components**

All components use the same pattern:

```javascript
const { logoUrl, logoWidth, logoHeight, logoAlt } = useSiteLogo();

<img 
  src={logoUrl} 
  alt={logoAlt}
  style={{ width: logoWidth, height: logoHeight }}
  className="object-contain"
/>
```

**Components using logo:**
- ✅ Admin: `/admin/src/components/AdminLayout.jsx` (Sidebar)
- ✅ Frontend: `/frontend/src/components/layout/Navbar.jsx` (Header)
- ✅ Frontend: `/frontend/src/components/layout/Footer.jsx` (Footer)

### 5. **Admin Settings Page**

**File:** `/admin/src/pages/Settings.jsx`

Features:
- Logo upload with preview
- Width/Height inputs
- Alt text for SEO
- Save button triggers:
  1. Upload to backend
  2. Store in MongoDB
  3. `refetch()` updates all components globally
  4. No page refresh needed ✨

---

## Complete Flow (Admin Updates Logo)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Admin Selects File                                           │
│    - File preview shown                                         │
│    - User sets width/height                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 2. Admin Clicks "Save Logo & Apply Globally"                    │
│    - Validates inputs                                           │
│    - Creates FormData with file + settings                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 3. PUT /api/settings/logo (multer uploads to disk/Cloudinary)   │
│    - Multer processes file                                      │
│    - Backend builds URL                                         │
│    - Upserts to SiteSettings collection                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 4. Response: Updated settings object                            │
│    {                                                            │
│      logoUrl: "https://res.cloudinary.com/.../logo.png",       │
│      logoWidth: "120px",                                        │
│      logoHeight: "auto"                                         │
│    }                                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 5. Frontend: refetch() called                                   │
│    - Calls GET /api/settings                                    │
│    - Updates Context State                                      │
│    - All components re-render with new logo                     │
│    - NO PAGE REFRESH NEEDED ✨                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
 ┌─────────────────────────▼──────────────────────────────┐
 │ 6. Shared Everywhere!                                  │
 │    ✨ Admin Dashboard (Sidebar Logo)                    │
 │    ✨ Website Navbar                                    │
 │    ✨ Website Footer                                    │
 │    - All with SAME width, height, alt text             │
 └──────────────────────────────────────────────────────────┘
```

---

## File Changes Made

### Backend
- ✅ `SiteSettings` model in `/backend/src/models/ShippingSettings.js`
- ✅ `getSiteSettings()` in `/backend/src/controllers/shippingController.js`
- ✅ `updateSiteLogo()` in `/backend/src/controllers/shippingController.js`
- ✅ Routes in `/backend/src/routes/settings.js`

### Frontend
- ✅ **Improved** `/frontend/src/context/SiteLogoContext.jsx` (refetch + error handling)
- ✅ Uses in `Navbar.jsx`, `Footer.jsx` ✓

### Admin
- ✅ **Complete Rewrite** `/admin/src/pages/Settings.jsx` (added logo section)
- ✅ **Improved** `/admin/src/context/SiteLogoContext.jsx` (refetch + error handling)
- ✅ Uses in `AdminLayout.jsx` ✓

---

## Testing Steps

### 1. Start Backend
```bash
cd backend
npm run dev
```
Verify: `🚀 spiritual-revamp API running on port 5000`

### 2. Start Admin
```bash
cd admin
npm run dev
```
Open: `http://localhost:5174`
Login with: `admin@spiritual-revamp.in` / `Admin@123`

### 3. Test Logo Upload
1. Go to **Settings** page
2. Upload a logo image
3. Set width: `150px`, height: `auto`
4. Click **Save Logo & Apply Globally**
5. ✅ Should see toast: "Logo updated! Refreshing globally..."

### 4. Verify Display
**In Admin Dashboard:**
- Sidebar header shows new logo ✅

**In Website:**
1. Open `http://localhost:5173` (frontend)
2. Header navbar shows new logo ✅
3. Footer shows new logo ✅
4. Sizes match everywhere ✅

### 5. Test Without Page Refresh
1. Go back to Settings
2. Change width to `180px`
3. Save
4. Without refreshing the page → website logo updates instantly ✅

---

## API Response Examples

### GET /api/settings
```json
{
  "success": true,
  "settings": {
    "logoUrl": "https://res.cloudinary.com/df9ftwtis/image/upload/v1234567/logo.png",
    "logoWidth": "120px",
    "logoHeight": "auto",
    "logoAlt": "spiritual-revamp"
  }
}
```

### PUT /api/settings/logo (Request)
```
Content-Type: multipart/form-data

logo: <binary file>
logoWidth: "150px"
logoHeight: "auto"
logoAlt: "spiritual-revamp"
```

### PUT /api/settings/logo (Response)
```json
{
  "success": true,
  "settings": {
    "_id": "507f1f77bcf86cd799439011",
    "logoUrl": "https://res.cloudinary.com/df9ftwtis/image/upload/v1234567/logo.png",
    "logoWidth": "150px",
    "logoHeight": "auto",
    "logoAlt": "spiritual-revamp",
    "createdAt": "2025-04-11T10:00:00.000Z",
    "updatedAt": "2025-04-11T10:05:00.000Z"
  }
}
```

---

## Troubleshooting

### Logo doesn't show after upload
1. ✅ Check MongoDB: Should have ONE `SiteSettings` document
   ```bash
   db.sitesettings.findOne()
   ```

2. ✅ Check if file uploaded to Cloudinary/disk
   - Cloudinary: Check `spiritual-revamp/media` folder
   - Disk: Check `backend/uploads/logos/`

3. ✅ Clear browser cache: `Ctrl+Shift+Delete`

4. ✅ Check Context refetch:
   ```javascript
   // In Admin Settings.jsx
   setTimeout(() => refetch(), 500); // Ensure refetch is called
   ```

### Components show old logo
- Context not provided → Wrap in `SiteLogoProvider`
- Refetch not called → Check Settings.jsx `handleLogoSave`
- Cache issue → Hard refresh browser

### Size not applied
- Check input value in Settings
- Verify CSS is valid: "120px" not "120"
- Check `style={{ width: logoWidth }}` is applied

---

## Code Examples

### Using Logo in a Component
```javascript
import { useSiteLogo } from '../context/SiteLogoContext';

export function MyComponent() {
  const { logoUrl, logoWidth, logoHeight, logoAlt, loading } = useSiteLogo();

  if (loading) return <div>Loading...</div>;

  return (
    <img
      src={logoUrl}
      alt={logoAlt}
      style={{ width: logoWidth, height: logoHeight }}
      className="object-contain"
    />
  );
}
```

### Triggering Refetch
```javascript
import { useSiteLogo } from '../context/SiteLogoContext';

export function SettingsPage() {
  const { refetch } = useSiteLogo();

  const handleSave = async () => {
    // ... save logic
    await api.put('/settings/logo', data);
    refetch(); // ← Updates all components!
  };
}
```

---

## Single Source of Truth ✨

**Before (Broken):**
- Multiple logo entries in database
- Components use hardcoded paths
- Size settings scattered
- No global updates

**After (Fixed):**
- ✅ **One SiteSettings document** (singleton)
- ✅ **One API endpoint** for updates
- ✅ **One Context** for global state
- ✅ **All components** pull from context
- ✅ **Instant updates** via refetch
- ✅ **No manual refresh** needed

---

## Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| Multiple settings docs | ❌ | ✅ Singleton with upsert |
| Logo URL storage | ❌ Missing | ✅ Full URL stored |
| Size management | ❌ Hardcoded | ✅ Configurable globally |
| Component updates | ❌ Manual refresh | ✅ Instant (refetch) |
| Admin UI | ❌ None | ✅ Settings page |
| Error handling | ❌ Silent | ✅ Visible feedback |

---

## Result ✨

**Admin Dashboard:**
```
Settings → Upload Logo → Save
         ↓
      Stored in MongoDB (ONE doc)
         ↓
      refetch() updates Context
         ↓
  All components re-render with:
   - Logo URL
   - Width: 150px
   - Height: auto
   - NO REFRESH NEEDED
```

**Website:**
- Navbar shows logo ✅
- Footer shows logo ✅
- Sizes match ✅
- Updates instant ✅

---

**Backend:** Model + API ✅
**Frontend:** Context + Usage ✅  
**Admin:** Settings Page ✅  
**Result:** Single source of truth ✅
