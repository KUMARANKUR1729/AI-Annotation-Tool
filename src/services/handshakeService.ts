import * as vscode from 'vscode';

export async function ensureHandshake() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    const fileUri = vscode.Uri.joinPath(
        folders[0].uri,
        '.github',
        'copilot-instructions.md'
    );

    try {
        await vscode.workspace.fs.readFile(fileUri);
    } catch {
        const content = `
###AI_GEN_START###
[AI GENERATED CODE]
###AI_GEN_END###
        `;

        await vscode.workspace.fs.createDirectory(
            vscode.Uri.joinPath(folders[0].uri, '.github')
        );

        await vscode.workspace.fs.writeFile(
            fileUri,
            Buffer.from(content)
        );

        vscode.window.showInformationMessage("Handshake file created");
    }
}