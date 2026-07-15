# Issue: Add an Image Preprocessing Pipeline Before ASCII Conversion

## Problem

The current renderer converts the input image directly into ASCII after a basic resize and grayscale conversion.

This works for simple images but produces poor portrait quality because the renderer receives an unoptimized image.

Professional ASCII generators first preprocess the image to isolate the subject, normalize lighting, remove noise, and enhance important features before mapping pixels to ASCII characters.

Our renderer should adopt a similar preprocessing pipeline.

---

# Current Pipeline

```
Image
   ↓
Resize
   ↓
Grayscale
   ↓
ASCII Mapping
```

This preserves every shadow, wrinkle, background texture, and lighting variation, resulting in noisy output.

---

# Desired Pipeline

```
Image
   ↓
Background Suppression
   ↓
Brightness Normalization
   ↓
Contrast Optimization
   ↓
Noise Reduction
   ↓
Sharpness Enhancement
   ↓
Resize
   ↓
Adaptive Character Mapping
   ↓
ASCII Output
```

Each preprocessing step should improve portrait readability rather than simply preserving pixel accuracy.

---

# Required Image Controls

The renderer should internally support preprocessing similar to high-quality ASCII generators.

## 1. Character Resolution

Controls how many ASCII characters are used to represent the image.

Lower values:

- larger character blocks
- cleaner silhouette
- less visual noise

Higher values:

- more detail
- increased clutter
- harder to recognize at small sizes

For profile cards, prioritize readability over maximum detail.

---

## 2. Brightness Adjustment

Normalize exposure before conversion.

Purpose:

- recover details in dark images
- prevent bright images from becoming washed out
- create consistent results across different profile photos

This should happen before grayscale conversion.

---

## 3. Contrast Adjustment

Contrast should enhance the face, not exaggerate every pixel.

Too little contrast:

- flat portrait

Too much contrast:

- noisy portrait
- excessive use of dark characters

The renderer should apply moderate contrast compression instead of aggressive enhancement.

---

## 4. Saturation

Although the final output is monochrome, saturation influences grayscale conversion.

Before grayscale:

- increase slightly for low-color images
- reduce for overly colorful images

This produces cleaner luminance values.

---

## 5. Grayscale Conversion

Do not simply average RGB values.

Use perceptual luminance.

Example

```
Y = 0.299R + 0.587G + 0.114B
```

This preserves facial structure much better.

---

## 6. Sharpness

Apply slight sharpening only around meaningful edges.

Enhance:

- eyes
- hairline
- jawline
- nose

Avoid enhancing:

- skin texture
- JPEG artifacts
- background noise

---

## 7. Edge Enhancement

Optional but useful.

Detect major edges around:

- face
- hair
- shoulders

Do not apply globally.

Edge enhancement should improve shape recognition rather than outlining every object.

---

## 8. Background Suppression

The background should contribute almost nothing to the final ASCII.

Pipeline

```
Detect Subject
        ↓
Reduce Background Contrast
        ↓
Replace Uniform Regions With Spaces
```

This ensures the character budget is spent on the portrait.

---

## 9. Adaptive Thresholding

Instead of fixed brightness mapping, adapt to each image.

Benefits:

- handles dark photos
- handles bright photos
- produces consistent character distribution

---

## 10. Character Density Control

The renderer should not attempt to fill every available cell.

Instead:

```
Face → High Density

Hair → Medium Density

Clothing → Low Density

Background → Mostly Spaces
```

Whitespace is essential for readability.

---

## 11. Dithering

Support optional dithering methods.

Examples:

- Floyd–Steinberg
- Stucki
- Atkinson
- Ordered Bayer

Portrait mode should use a subtle dithering algorithm or disable it if it introduces unnecessary texture.

---

## 12. Character Gradient

Allow multiple ASCII ramps.

Examples:

Light

```
@%#*+=-:.
```

Medium

```
@#*=-
```

Dense

```
$@B%8&WM#*oahkbdpqwmZO0QLCJ
```

The renderer should automatically choose the appropriate gradient based on the target resolution and portrait mode.

---

## 13. Space Density Optimization

One of the most important improvements.

Large bright regions should become spaces.

Instead of

```
:::
--------------------------
==========================
```

Prefer

```
          #######
        ###########
      ###############
```

Whitespace should dominate non-subject regions.

---

# Portrait Rendering Mode

For profile cards, the renderer should enable a dedicated **Portrait Mode**.

Portrait Mode priorities:

1. Preserve face shape.
2. Preserve hair outline.
3. Preserve eyes.
4. Remove background.
5. Reduce clothing detail.
6. Simplify lighting.
7. Increase whitespace.
8. Optimize character density.
9. Produce a recognizable silhouette.

The goal is **recognition**, not pixel-perfect reproduction.

---

# Acceptance Criteria

- [ ] Image preprocessing is applied before ASCII conversion.
- [ ] Brightness and contrast are normalized automatically.
- [ ] Background is suppressed.
- [ ] Subject receives most of the character density.
- [ ] Character resolution is optimized for portrait rendering.
- [ ] Sharpness enhances facial edges rather than noise.
- [ ] Optional dithering improves gradients without adding clutter.
- [ ] Whitespace dominates non-subject regions.
- [ ] Character gradient adapts to portrait mode.
- [ ] The resulting ASCII portrait is immediately recognizable, even at small sizes.
