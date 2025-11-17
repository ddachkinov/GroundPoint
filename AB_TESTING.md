# A/B Testing Guide for GroundPoint

This document explains how the A/B testing system works in GroundPoint and how to analyze results.

## Overview

GroundPoint includes built-in A/B testing for the landing page to optimize conversion rates. The system tests different variations of:

- **Headlines** - Different value propositions
- **CTAs (Call-to-Actions)** - Different button text
- **Testimonials** - Different social proof

## How It Works

### 1. Variant Assignment

When a user first visits the landing page:

1. The system checks for an existing variant in `localStorage`
2. If none exists, it randomly assigns a variant
3. The variant is stored in `localStorage` to ensure consistency
4. The assignment is tracked in analytics

**Code location:** `frontend/src/pages/LandingPage.tsx`

```typescript
const newVariant = {
  headline: Math.floor(Math.random() * variants.headlines.length),
  cta: Math.floor(Math.random() * variants.ctas.length),
  testimonial: Math.floor(Math.random() * variants.testimonials.length),
};
localStorage.setItem('ab_variant', JSON.stringify(newVariant));
```

### 2. Current Variants

#### Headlines
- **Variant 0:** "Track Construction Progress from the Sky"
- **Variant 1:** "Monitor Every Stage of Your Build with Drone Photography"
- **Variant 2:** "Transform Drone Footage into Actionable Insights"

#### CTAs
- **Variant 0:** "Start Free Trial"
- **Variant 1:** "Try Demo Now"
- **Variant 2:** "Get Started Free"

#### Testimonials
- **Variant 0:** Mike Johnson - Commercial Drone Operator
- **Variant 1:** Sarah Chen - Construction Manager
- **Variant 2:** David Martinez - Drone Pilot

### 3. Event Tracking

The following events are tracked:

#### Assignment Event
```javascript
analytics.track('ab_test_assigned', {
  headline_variant: 0,
  cta_variant: 1,
  testimonial_variant: 2,
});
```

#### Interaction Events
```javascript
analytics.track('cta_clicked', {
  action: 'demo',
  variant: 1,
  location: 'hero',
});
```

#### Conversion Events
```javascript
analytics.track('signup_completed', {
  headline_variant: 0,
  cta_variant: 1,
  source: 'landing_page',
});
```

## Adding New Variants

### 1. Edit the Variants Object

In `frontend/src/pages/LandingPage.tsx`, update the `variants` object:

```typescript
const variants = {
  headlines: [
    'Track Construction Progress from the Sky',
    'Monitor Every Stage of Your Build with Drone Photography',
    'Transform Drone Footage into Actionable Insights',
    'Your New Headline Here', // Add new variant
  ],
  // ... other variants
};
```

### 2. Deploy Changes

```bash
cd frontend
npm run build
# Deploy to your hosting platform
```

### 3. Clear Test Data (optional)

To reset variant assignments for testing:

```javascript
// In browser console
localStorage.removeItem('ab_variant');
location.reload();
```

## Analyzing Results

### 1. Google Analytics 4

#### Setup Custom Dimensions

1. Go to GA4 Admin → Data Display → Custom Definitions
2. Create custom dimensions:
   - `headline_variant` (Event-scoped)
   - `cta_variant` (Event-scoped)
   - `testimonial_variant` (Event-scoped)

#### Create Reports

**Navigate to:** Explore → Create Exploration

**Setup:**
1. Add dimensions: `headline_variant`, `cta_variant`
2. Add metrics: `Event count`, `Conversions`
3. Filter by event: `signup_completed`

**Example Query:**

```
Event name = ab_test_assigned
+ Event count
+ Group by: headline_variant
```

### 2. Segment Analytics

#### Create Funnels

1. Go to Segment → Funnels
2. Create funnel:
   - Step 1: Landing Page View
   - Step 2: CTA Clicked
   - Step 3: Signup Completed
3. Group by: `headline_variant`, `cta_variant`

#### Example SQL Query

```sql
SELECT
  properties.headline_variant,
  properties.cta_variant,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN event = 'signup_completed' THEN 1 ELSE 0 END) as conversions,
  (SUM(CASE WHEN event = 'signup_completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT user_id)) as conversion_rate
FROM events
WHERE event IN ('ab_test_assigned', 'signup_completed')
  AND timestamp > CURRENT_DATE - INTERVAL '30 days'
GROUP BY properties.headline_variant, properties.cta_variant
ORDER BY conversion_rate DESC;
```

### 3. Sample Size Calculator

Before concluding tests, ensure statistical significance:

**Minimum recommended:**
- 100 visitors per variant
- 7 days of data
- 95% confidence level

**Online calculators:**
- https://www.optimizely.com/sample-size-calculator/
- https://www.evanmiller.org/ab-testing/sample-size.html

## Best Practices

### 1. Test One Thing at a Time

While we have multiple variant types, focus analysis on one dimension:

```javascript
// Good: Test headline impact
WHERE headline_variant IN (0, 1)
  AND cta_variant = 0
  AND testimonial_variant = 0

// Bad: Test everything simultaneously
WHERE headline_variant IN (0, 1)
  AND cta_variant IN (0, 1, 2)
  AND testimonial_variant IN (0, 1, 2)
```

### 2. Run Tests Long Enough

- Minimum 1 week (captures weekly patterns)
- Aim for 2-4 weeks for reliable results
- Account for seasonality in construction industry

### 3. Monitor External Factors

Document external events that might affect results:
- Marketing campaigns
- Industry events
- Seasonal changes
- Pricing changes

### 4. Document Winners

When a test concludes:

1. Document results in this file
2. Update default variant in code
3. Remove losing variants
4. Plan next test

## Past Test Results

### Test #1: Initial Baseline (Example)

**Period:** 2025-01-01 to 2025-01-31
**Sample Size:** 500 visitors
**Results:**

| Variant | Headline | Visitors | Signups | Conv. Rate |
|---------|----------|----------|---------|------------|
| 0 | "Track Construction..." | 167 | 15 | 9.0% |
| 1 | "Monitor Every Stage..." | 166 | 12 | 7.2% |
| 2 | "Transform Drone Footage..." | 167 | 18 | 10.8% |

**Winner:** Variant 2 (10.8% conversion rate)
**Statistical Significance:** Yes (p < 0.05)
**Action:** Set Variant 2 as default

## Troubleshooting

### Variants Not Changing

1. Clear localStorage: `localStorage.removeItem('ab_variant')`
2. Clear browser cache
3. Try incognito/private browsing
4. Check browser console for errors

### Events Not Tracking

1. Verify analytics initialization in browser console:
   ```javascript
   console.log(window.analytics);
   console.log(window.gtag);
   ```
2. Check network tab for analytics requests
3. Verify environment variables:
   - `VITE_GA_MEASUREMENT_ID`
   - `VITE_SEGMENT_WRITE_KEY`

### Uneven Distribution

If variants aren't evenly distributed:
1. Check random number generator
2. Ensure no caching issues
3. Verify localStorage is working
4. Check for browser quirks

## Advanced: Multivariate Testing

To test combinations of variants:

```typescript
// Calculate unique combinations
const totalCombinations =
  variants.headlines.length *
  variants.ctas.length *
  variants.testimonials.length;

// Example: 3 headlines × 3 CTAs × 3 testimonials = 27 combinations
// Requires 27 × 100 = 2,700 visitors minimum
```

**Recommendation:** Start with univariate tests, graduate to multivariate once you have sufficient traffic.

## Resources

- [Optimizely A/B Testing Guide](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [Google Optimize Documentation](https://support.google.com/optimize/)
- [Evan Miller's A/B Testing Tools](https://www.evanmiller.org/ab-testing/)
- [Statistical Significance Calculator](https://www.surveymonkey.com/mp/ab-testing-significance-calculator/)
