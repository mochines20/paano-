/**
 * Share utilities para sa PAANO.
 * Gumagamit ng Web Share API kapag available (mobile),
 * fallback sa clipboard copy.
 */

export async function shareText(title: string, text: string): Promise<"shared" | "copied" | "failed"> {
  const shareData = {
    title: `PAANO — ${title}`,
    text,
  };

  // Web Share API — gumagana sa mobile browsers
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch {
      // User cancelled — huwag ituring na failure
      return "failed";
    }
  }

  // Fallback: copy to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
