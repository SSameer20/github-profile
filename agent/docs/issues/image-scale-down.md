# Issue: Standardize Image → ASCII Rendering for GitHub Profile Cards

## Problem

The generated ASCII avatar is inconsistent in size and aspect ratio, causing the overall profile card layout to look uneven.

The profile card should always have a fixed canvas where:

- Total height is fixed.
- Avatar occupies exactly the left half.
- Profile information occupies exactly the right half.
- Every generated profile has identical dimensions regardless of the source image.

The reference image should be treated as the layout specification.

---

# Target Layout

```
+---------------------------------------------------------------+
|                    Entire Profile Card                        |
|                                                               |
|  ASCII Portrait             |        Profile Information      |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
|                             |                                |
+---------------------------------------------------------------+
```

The entire content inside the triple backticks is the rendering area.

Everything must fit inside this box.

---

# Fixed Dimensions

## Height

The complete card must always be

**25 text rows**

No exceptions.

```
Line 1
Line 2
...
Line 25
```

If the image naturally generates more than 25 rows:

- scale it down

If it generates fewer rows:

- scale it up

Never overflow.

---

## Width

The total width should also be fixed.

Recommended width:

```
100–110 characters
```

Example

```
105 columns
```

Then split equally.

```
52 columns
|
53 columns
```

Left

```
ASCII Image
```

Right

```
Profile data
```

Never allow one side to become larger.

---

# Equal Split

The layout is always

```
50%
|
50%
```

Example

```
####################################################|####################################################
####################################################|####################################################
####################################################|####################################################
####################################################|####################################################
####################################################|####################################################
```

The separator should remain vertically aligned across all 25 rows.

---

# ASCII Avatar Area

The avatar must use the full left section.

Requirements:

- vertically centered
- horizontally centered
- preserve aspect ratio
- preserve facial proportions
- never stretch independently
- never squash independently

Instead:

Scale the image uniformly until it fits inside the available region.

---

# Character Resolution

The ASCII renderer must generate exactly enough characters to fill

```
Height = 25 rows

Width ≈ 50 columns
```

Do **not** render at arbitrary resolutions.

The renderer should receive an explicit target size.

Example

```
Target Height = 25

Target Width = 52
```

before converting pixels into ASCII.

---

# Character Aspect Ratio Compensation

Terminal characters are not square.

Typical terminal characters are approximately

```
Width : Height

1 : 2
```

or

```
0.5 aspect ratio
```

The renderer must compensate for this before resizing.

Otherwise faces become stretched vertically.

Recommended workflow

```
Original Image

↓

Apply font aspect correction

↓

Resize to target dimensions

↓

Convert brightness

↓

Map to ASCII characters
```

---

# Cropping Rules

Never crop important facial regions.

Priority:

1. Eyes
2. Nose
3. Mouth
4. Hair
5. Shoulders

If cropping is required:

Crop from

- background
- empty margins

Never crop the face.

---

# Image Scaling Rules

Scaling should follow

```
Contain
```

NOT

```
Cover
```

Meaning

The entire face should always remain visible.

Unused space should be padded.

---

# Padding

If the portrait does not occupy the full area,

pad using spaces.

Example

```
      @@@@@@@
    @@@@@@@@@@@
   @@@@@@@@@@@@@
      @@@@@@@
```

not

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
```

The image should remain centered.

---

# Vertical Alignment

Avatar should be vertically centered.

Bad

```
@@@@@@
@@@@@@
@@@@@@





```

Good

```




@@@@@@
@@@@@@
@@@@@@



```

---

# Horizontal Alignment

The portrait should also be horizontally centered.

Bad

```
@@@@@@
@@@@@@
@@@@@@
```

Good

```
       @@@@@@
      @@@@@@@@
       @@@@@@
```

---

# ASCII Density

Use a consistent density ramp.

Example

```
@%#*+=-:.
```

or

```
$@B%8&WM#*oahkbdpqwmZO0QLCJ
```

The same density table must be used for every generation.

Do not randomly switch character sets.

---

# Output Constraints

The renderer must always produce:

- Exactly 25 rows.
- Fixed overall width (100–110 columns).
- Left section fixed width.
- Right section fixed width.
- Center divider aligned across all rows.
- No overflow.
- No wrapping.
- No clipped ASCII.
- No clipped profile data.

---

# Layout Pipeline

```
Reference Image
        │
        ▼
Detect Face
        │
        ▼
Apply Character Aspect Ratio Compensation
        │
        ▼
Resize (Contain)
        │
        ▼
Generate ASCII
        │
        ▼
Center Horizontally
        │
        ▼
Center Vertically
        │
        ▼
Pad Remaining Space
        │
        ▼
Place Inside Left 50%
        │
        ▼
Render Profile Information in Right 50%
        │
        ▼
Output Fixed 25-Line Profile Card
```

---

# Acceptance Criteria

- [ ] Output is always exactly **25 lines** tall.
- [ ] Total card width remains fixed (100–110 columns).
- [ ] Left and right sections are split approximately **50/50**.
- [ ] ASCII avatar never exceeds its allocated area.
- [ ] Portrait preserves aspect ratio and facial proportions.
- [ ] Avatar is horizontally centered.
- [ ] Avatar is vertically centered.
- [ ] Entire face is visible without clipping.
- [ ] Character aspect ratio compensation is applied before resizing.
- [ ] Profile information never shifts due to avatar size.
- [ ] Divider remains perfectly aligned across all 25 rows.
- [ ] Every generated profile card has identical dimensions regardless of the input image.
