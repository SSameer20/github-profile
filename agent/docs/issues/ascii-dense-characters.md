# Issue: Improve Image → ASCII Conversion Quality

## Problem

The current ASCII generation is prioritizing pixel density instead of visual recognition.

The output is extremely noisy, making it difficult to recognize the subject. Almost every character cell contains a symbol, leaving very little negative space. The result looks like random text rather than an ASCII portrait.

---

# Current Issues

## 1. Contrast is Too High

The converter maps nearly every brightness difference into a different character.

Result:

- Very harsh transitions
- Too much texture
- Facial details disappear
- Hair and background blend together

Instead, reduce contrast before character mapping.

The goal is to preserve large shapes, not tiny pixel differences.

---

## 2. Too Much Visual Noise

Nearly every cell is occupied by a character.

Example:

```
@@@@@@@@@&&&&&&%%##**+++====---
```

Instead, large flat regions should mostly contain spaces.

Example:

```
      @@@@@
    @@@@@@@@@
   @@@@@@@@@@@
      @@@@@
```

Negative space is one of the most important parts of good ASCII art.

---

## 3. Background Should Disappear

The converter currently treats the background the same as the subject.

Instead:

- detect the foreground
- reduce background importance
- map bright or uniform background regions to spaces

The viewer should immediately notice the face, not the background texture.

---

## 4. Overuse of Dense Characters

Characters like

```
@
#
&
$
8
B
M
```

are used far too frequently.

These should only represent the darkest areas.

Large portions of the image should instead use:

```
' . :
```

or simply

```
(space)
```

---

## 5. Too Many Brightness Levels

The renderer is using too many intensity levels.

Small lighting changes become different symbols, creating unnecessary detail.

Instead, quantize the image into fewer brightness bands before mapping to ASCII.

Example:

```
Original
↓

256 grayscale levels

↓

16–32 brightness levels

↓

ASCII mapping
```

This produces cleaner edges and more recognizable shapes.

---

## 6. Lack of Negative Space

ASCII art relies heavily on empty regions.

Current output:

```
####################################
####################################
####################################
####################################
```

Desired output:

```
      #######
    ###########
   #############
      #######
```

The empty space improves readability far more than adding extra characters.

---

## 7. Preserve Overall Shape First

Priority should be:

1. Head silhouette
2. Hair outline
3. Eyes
4. Nose
5. Mouth
6. Small texture

Current implementation appears to prioritize texture over structure.

Reverse this priority.

---

## 8. Apply Smoothing Before Conversion

The source image likely contains sensor noise, compression artifacts, and tiny color variations.

Before ASCII conversion:

- apply a slight blur or smoothing filter
- reduce tiny pixel differences
- preserve only major edges

This significantly improves portrait readability.

---

## 9. Improve Character Mapping

Instead of mapping each pixel independently:

- consider a small neighborhood (2×2 or 3×3)
- use the average luminance
- choose a single representative character

This reduces random symbol changes between adjacent cells.

---

## 10. Adaptive Thresholding

Instead of a fixed mapping, adapt the brightness distribution based on the image.

Pipeline:

```
Input Image
        ↓
Histogram Analysis
        ↓
Brightness Normalization
        ↓
Contrast Compression
        ↓
Quantization
        ↓
ASCII Mapping
```

This prevents both washed-out and overly dense outputs.

---

## 11. Subject-Focused Rendering

The converter should allocate most of its visual detail to the subject.

Desired behavior:

- face → high detail
- hair → medium detail
- clothing → low detail
- background → minimal detail or spaces

The current output gives all regions equal importance.

---

## 12. Reduce Character Set Complexity

Avoid using an excessively large ASCII ramp.

A simpler ramp often produces better portraits.

Example:

```
@%#*+=-:.
```

or even

```
@#*=-
```

Less variation creates cleaner, more recognizable shapes.

---

# Desired Rendering Pipeline

```
Reference Image
        ↓
Resize
        ↓
Noise Reduction
        ↓
Histogram Normalization
        ↓
Contrast Compression
        ↓
Brightness Quantization
        ↓
Foreground Emphasis
        ↓
ASCII Character Mapping
        ↓
Whitespace Optimization
        ↓
Final ASCII Portrait
```

---

# Acceptance Criteria

- [ ] Background is mostly rendered as spaces.
- [ ] Dense characters (`@`, `#`, `&`, `$`, `8`, `B`) are used only for the darkest regions.
- [ ] Large flat areas are represented with whitespace instead of unnecessary symbols.
- [ ] Contrast is reduced to preserve overall facial structure rather than pixel-level detail.
- [ ] Noise is minimized, producing smoother transitions between characters.
- [ ] The subject is immediately recognizable at a glance.
- [ ] The face and silhouette are prioritized over fine texture.
- [ ] Character mapping is based on local regions rather than individual pixels where appropriate.
- [ ] The final output has a balanced mix of characters and whitespace, improving readability and visual clarity.
