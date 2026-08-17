/**
 * Share utilities para sa PAANO.
 * Gumagamit ng Web Share API kapag available (mobile),
 * fallback sa clipboard copy.
 */

export async function shareText(
  title: string,
  text: string,
  url?: string,
): Promise<"shared" | "copied" | "failed"> {
  const shareData: ShareData = {
    title: `PAANO — ${title}`,
    text,
    ...(url ? { url } : {}),
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

  // Fallback: copy to clipboard (include URL sa text kung meron)
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      const clipboardText = url ? `${text}\n\nLink: ${url}` : text;
      await navigator.clipboard.writeText(clipboardText);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
