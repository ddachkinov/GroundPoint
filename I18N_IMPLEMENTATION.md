# Multilanguage Implementation Guide

This document describes the multilanguage (i18n) implementation for the GroundPoint application.

## Languages Supported

- **Bulgarian (bg)** - Primary language (default)
- **English (en)** - Secondary language

## Frontend Implementation

### Setup

The frontend uses `i18next` with `react-i18next` for internationalization.

**Dependencies installed:**
- `i18next` - Core i18n framework
- `react-i18next` - React bindings
- `i18next-browser-languagedetector` - Automatic language detection
- `i18next-http-backend` - Load translations from JSON files

**Configuration:** `/frontend/src/i18n.ts`

### Translation Files

Translation files are located in `/frontend/public/locales/{language}/translation.json`

**Structure:**
```json
{
  "common": {
    "appName": "GroundPoint",
    "logout": "Logout",
    ...
  },
  "auth": {
    "signIn": "Sign in",
    ...
  },
  "dashboard": {
    "welcome": "Welcome to GroundPoint!",
    ...
  },
  "projects": {
    "projects": "Projects",
    ...
  }
}
```

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
}
```

### Language Switcher

The `LanguageSwitcher` component is available in `/frontend/src/components/LanguageSwitcher.tsx`

It displays БГ/EN buttons to switch between Bulgarian and English.

**Usage:**
```tsx
import { LanguageSwitcher } from '../components/LanguageSwitcher';

<LanguageSwitcher />
```

### Language Detection

The app automatically detects the user's language preference in this order:
1. Previously selected language (stored in localStorage)
2. Browser language
3. Falls back to Bulgarian (bg)

## Backend Implementation

### Setup

The backend uses `i18next` with `i18next-fs-backend` for server-side translations.

**Dependencies installed:**
- `i18next` - Core i18n framework
- `i18next-fs-backend` - Load translations from file system
- `i18next-http-middleware` - Express middleware (for future API i18n)

**Configuration:** `/backend/src/config/i18n.ts`

### Translation Files

Backend translation files are located in `/backend/locales/{language}/translation.json`

**Structure:**
```json
{
  "email": {
    "invoiceSent": {
      "subject": "New invoice from {{operatorName}}: {{invoiceNumber}}",
      "greeting": "Hi {{clientName}},",
      ...
    },
    ...
  }
}
```

### Usage in Email Templates

```typescript
import { getEmailTranslator, getUserLanguage } from '../utils/email-i18n';

function sendEmail(user: User) {
  const lang = getUserLanguage(user);
  const t = getEmailTranslator(lang);

  const subject = t('email.invoiceSent.subject', {
    operatorName: 'Example',
    invoiceNumber: '001'
  });
}
```

## Database Schema

A `language` field has been added to the `User` model:

```prisma
model User {
  // ... other fields
  language String @default("bg")
  // ... other fields
}
```

**Default:** Bulgarian (`bg`)

## Migration Steps

To apply the database changes:

```bash
cd backend
npx prisma migrate dev --name add_user_language
npx prisma generate
```

## Adding New Translations

### Frontend

1. Add the new key to `/frontend/public/locales/bg/translation.json`
2. Add the corresponding English translation to `/frontend/public/locales/en/translation.json`
3. Use the translation in your component: `{t('your.new.key')}`

### Backend

1. Add the new key to `/backend/locales/bg/translation.json`
2. Add the corresponding English translation to `/backend/locales/en/translation.json`
3. Use in email templates or services with `t('your.new.key')`

## Components Updated

### Frontend
- ✅ LoginPage
- ✅ RegisterPage
- ✅ LoginForm
- ✅ RegisterForm
- ✅ DashboardPage
- ✅ ProjectsPage
- ✅ LanguageSwitcher (new component)

### Backend
- ✅ i18n configuration
- ✅ Email translation structure
- ⏳ Email templates (infrastructure in place, full migration pending)

## Testing

1. **Language Switcher:** Click БГ/EN buttons to switch languages
2. **Browser Language:** Clear localStorage and refresh - app should detect browser language
3. **Persistence:** Selected language should persist across page refreshes

## Future Enhancements

1. Complete migration of all email templates to use i18n
2. Add user language preference API endpoint
3. Add more languages (e.g., German, French)
4. Implement date/time localization
5. Implement number/currency formatting per locale
6. Add language selector in user profile settings

## Notes

- All user-facing strings should use translations
- Never hardcode user-facing text
- Bulgarian is the primary language and default
- Translation keys should be descriptive (e.g., `auth.passwordRequirements` not `auth.pr`)
- Use interpolation for dynamic values: `t('key', { variable: value })`
