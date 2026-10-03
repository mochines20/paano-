/** Remove lightweight markdown markers before showing model steps in UI cards. */
export function cleanStepText(step: string): string {
  return step
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}
