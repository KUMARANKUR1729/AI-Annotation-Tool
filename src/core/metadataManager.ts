export function generateMeta(emp: string) {
    const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    return { emp, date };
}

export function updateEditedBy(existing: string, emp: string, date: string) {
    const stamp = `${emp} (${date})`;

    if (existing.includes(stamp)) return existing;

    if (existing.includes("EditedBy:")) {
        return `${existing}, ${stamp}`;
    }

    return `${existing} | EditedBy: ${stamp}`;
}