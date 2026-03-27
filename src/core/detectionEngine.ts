export function isAI(text: string, clipboard: string) {
    if (!text.trim()) return false;

    if (text.trim() === clipboard.trim()) return false;

    if (text.length > 20) return true;

    if (text.split("\n").length > 3) return true;

    return false;
}