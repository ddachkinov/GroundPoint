# Image Assets Guide

This directory contains image assets for the GroundPoint application.

## Adding Real Drone Construction Photos

To replace the placeholder images with actual drone construction photography:

### Landing Page Hero Image

Replace the placeholder with a high-quality aerial construction photo:

**Location:** `/images/hero-construction.jpg`
**Recommended specs:**
- Resolution: 1200x800px minimum (2400x1600px for retina displays)
- Format: JPG or WebP
- File size: < 500KB (optimized)
- Content: Aerial view of an active construction site showing progress

**Example shots:**
- Foundation work in progress
- Steel framework installation
- Multi-story building under construction
- Infrastructure development (bridges, roads, etc.)

### Demo Page Construction Photos

Add 6 sample construction progress photos to showcase the timeline feature:

**Location:** `/images/demo/construction-[1-6].jpg`
**Recommended specs:**
- Resolution: 800x600px minimum
- Format: JPG or WebP
- File size: < 300KB each
- Content: Sequential progress photos of the same site

**Suggested sequence:**
1. `construction-1.jpg` - Site preparation / excavation
2. `construction-2.jpg` - Foundation work
3. `construction-3.jpg` - Framework / structural work
4. `construction-4.jpg` - Mid-construction progress
5. `construction-5.jpg` - Near completion
6. `construction-6.jpg` - Final stages / finishing work

### Image Optimization

Before adding images, optimize them for web:

```bash
# Using ImageMagick
mogrify -resize 1200x800 -quality 85 hero-construction.jpg

# Using WebP for better compression
cwebp -q 85 hero-construction.jpg -o hero-construction.webp
```

### Stock Photo Sources (if needed)

If you don't have drone construction photos available, you can use stock photos:

**Free sources:**
- Unsplash (https://unsplash.com/s/photos/construction-aerial)
- Pexels (https://www.pexels.com/search/drone%20construction/)
- Pixabay (https://pixabay.com/images/search/construction%20site/)

**Paid sources (high quality):**
- Shutterstock
- Getty Images
- Adobe Stock

**Search terms:**
- "aerial construction site"
- "drone construction photography"
- "building progress aerial view"
- "construction site from above"
- "infrastructure construction drone"

### Copyright Notice

Ensure you have proper licenses/rights to use any images:
- Own photography: ✓
- Stock photos: Check license
- Client photos: Get written permission
- Photographer work: Purchase license or get permission

### Current Fallback Behavior

The application currently uses SVG placeholders when images are not found. The placeholders will display:
- A colored background
- Text indicating the image type
- Proper dimensions matching the expected image

To see your real images, simply place them in the correct location with the correct filename.

### Testing Images

After adding images:

1. Clear browser cache: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Check the demo page: `/demo`
3. Check the landing page: `/`
4. Verify images load on mobile devices
5. Test image loading performance

### Image Naming Convention

- Use lowercase
- Use hyphens (not underscores)
- Be descriptive
- Include numbers for sequences

Examples:
- ✓ `hero-construction.jpg`
- ✓ `construction-1.jpg`
- ✗ `IMG_1234.jpg`
- ✗ `Construction Photo.jpg`
