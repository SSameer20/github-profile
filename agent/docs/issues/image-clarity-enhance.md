## Feedback

# Issue: Renderer Is Converting the Entire Image Instead of the Subject

## Problem

The renderer is faithfully converting every pixel in the image into ASCII.

That is **not** the desired behavior.

The goal is **not to recreate the photograph**, but to create a recognizable ASCII portrait.

The current implementation gives equal importance to the background, empty regions, clothing, shadows, and facial features. As a result, the face gets lost in a sea of characters.

---

# Desired Output

The ASCII should primarily represent:

- Face
- Hair
- Head silhouette
- Neck
- Shoulders (optional)

Everything else should be heavily simplified or removed.

The portrait should look like a sketch, not a pixel-perfect conversion.

---

# Current Behavior

The renderer generates ASCII for:

- Background
- Empty walls
- Shadows
- Noise
- Clothing texture
- Small lighting variations
- Every pixel in the source image

This produces an image that is nearly 100% filled with characters.

The face no longer stands out because every region has the same visual weight.

---

# Expected Behavior

The renderer should allocate almost all character density to the subject.

Example priority:

```
Face            ██████████
Hair            ████████
Eyes            ███████
Nose            █████
Mouth           ████

Background      (mostly spaces)
```

The portrait should immediately draw the viewer's attention.

---

# Background Should Be Ignored

The background should not be rendered in detail.

Instead:

- Detect the foreground.
- Remove or suppress the background.
- Replace uniform background regions with spaces.

Current:

```
@@@@@@@@@@###***===:::....
```

Desired:

```
          #######
        ###########
      ###############
```

---

# Subject Segmentation

Before ASCII conversion, isolate the main subject.

Pipeline:

```
Original Image
        ↓
Foreground Detection
        ↓
Background Mask
        ↓
ASCII Conversion
```

Only the foreground should retain detail.

---

# Reduce Detail Outside the Face

Detail allocation should follow approximately:

| Region     | Detail |
| ---------- | ------ |
| Face       | 100%   |
| Hair       | 90%    |
| Neck       | 60%    |
| Shoulders  | 40%    |
| Clothing   | 20%    |
| Background | 0–10%  |

Currently every region receives roughly the same amount of detail.

---

# Preserve Shape, Not Texture

ASCII portraits are recognizable because they preserve large shapes.

The renderer should intentionally discard:

- fabric texture
- tiny shadows
- compression artifacts
- background gradients
- small wrinkles

These details waste the limited character budget.

---

# Use Whitespace Aggressively

Whitespace is a drawing tool.

The renderer should prefer spaces whenever possible.

Instead of

```
===========================
***************************
###########################
```

Prefer

```
        #######
      ###########
     #############
```

Empty space makes the portrait easier to recognize.

---

# Edge-Focused Rendering

Characters should appear primarily around:

- facial contours
- jawline
- hair outline
- eyes
- nose
- mouth

Flat regions should contain very few characters.

---

# Character Budget

There are only about **50 columns** available for the avatar.

Every character is valuable.

Do not waste characters describing the background.

Spend the available character budget on:

- facial structure
- silhouette
- expression

---

# Rendering Philosophy

Current renderer:

> "Convert every visible pixel."

Desired renderer:

> "Draw an ASCII portrait."

These are fundamentally different goals.

The renderer should behave more like an artist making a sketch than a printer reproducing pixels.

---

# Acceptance Criteria

- [ ] Background is mostly blank.
- [ ] The face receives the highest level of detail.
- [ ] Hair outline is clearly visible.
- [ ] The head silhouette is recognizable from a distance.
- [ ] Clothing and background are heavily simplified.
- [ ] Whitespace dominates non-subject regions.
- [ ] Character density is concentrated around facial features.
- [ ] The portrait is recognizable within a few seconds, even when viewed at a small size.
- [ ] The renderer prioritizes subject recognition over pixel accuracy.
