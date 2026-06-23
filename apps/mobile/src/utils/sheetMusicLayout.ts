/** Max rendered width for sheet music on tablets (centered). */
export const SHEET_MUSIC_MAX_WIDTH = 700;

/** Minimum touch target per platform accessibility guidelines. */
export const MIN_TOUCH_TARGET = 44;

export function computeContainedSize(
  naturalWidth: number,
  naturalHeight: number,
  availableWidth: number,
  availableHeight: number,
  maxWidth: number = SHEET_MUSIC_MAX_WIDTH,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: availableWidth, height: availableHeight };
  }

  const boxWidth = Math.min(availableWidth, maxWidth);
  const scale = Math.min(boxWidth / naturalWidth, availableHeight / naturalHeight);

  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}
