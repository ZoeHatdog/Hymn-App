# Sheet music images

Place sheet music image files here. Hymns can use **one image** or **multiple pages**.

## Option A — Image folder (multi-page)

Add an `image_folder:` line to the hymn `.txt` file. All `.jpg`, `.jpeg`, and `.png` files in that folder are loaded in sorted order (page 1, 2, 3…).

```
title: Praise, My Soul, The King of Heaven
author: Henry Francis Lyte (lyrics), John Goss (music)
image_folder: TBC - Hymns/Medium File

Praise, my soul, the King of heaven;
...
```

Folder path is relative to `data/hymns/images/`.

To test a different size tier, change the folder (e.g. `TBC - Hymns/Smallest`, `TBC - Hymns/Large-Size`) and re-run the seed.

## Option B — Single flat file

If no `image_folder` is set, the seed looks for a single file matching the text basename:

| Text file | Image file |
|-----------|------------|
| `amazing-grace.txt` | `amazing-grace.jpg` (or `.jpeg`, `.png`) |

## After adding or changing images

```bash
npm run db:seed
```

Supported formats: `.jpg`, `.jpeg`, `.png`
