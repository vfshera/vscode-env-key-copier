import * as vscode from "vscode";

function extractEnvKeys(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) => line && !line.startsWith("#") && /^[A-Z0-9_]+=/.test(line)
    )
    .map((line) => line.split("=")[0]);
}

export function activate(context: vscode.ExtensionContext) {
  const command = "envKeyCopier.copyKeys";

  const disposable = vscode.commands.registerCommand(command, async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return vscode.window.showErrorMessage("No active editor.");
    }

    const document = editor.document;
    const text = editor.selection.isEmpty
      ? document.getText()
      : document.getText(editor.selection);

    const keyValuePairs = extractEnvKeys(text);

    if (keyValuePairs.length === 0) {
      return vscode.window.showInformationMessage("No valid .env keys found.");
    }

    await vscode.env.clipboard.writeText(keyValuePairs.join("\n"));
    vscode.window.showInformationMessage(
      `Copied ${keyValuePairs.length} keys.`
    );
  });

  context.subscriptions.push(disposable);

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.command = command;
  statusBar.text = "$(key) Copy .env Keys";
  statusBar.tooltip = "Copy .env Keys";

  const updateStatusBarVisibility = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && /\.env(\..+)?$/.test(editor.document.fileName)) {
      statusBar.show();
    } else {
      statusBar.hide();
    }
  };

  updateStatusBarVisibility();
  vscode.window.onDidChangeActiveTextEditor(updateStatusBarVisibility);
  context.subscriptions.push(statusBar);
}

export function deactivate() {}
