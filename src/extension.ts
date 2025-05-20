import * as vscode from "vscode";

function extractEnvKeyValuePairs(text: string): [string, string][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) => line && !line.startsWith("#") && /^[A-Z0-9_]+=/.test(line)
    )
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key, rest.join("=")] as [string, string];
    });
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

    const keyValuePairs = extractEnvKeyValuePairs(text);

    if (keyValuePairs.length === 0) {
      return vscode.window.showInformationMessage("No valid .env keys found.");
    }

    const selected = await vscode.window.showQuickPick(
      keyValuePairs.map(([key, val]) => `${key}=${val}`),
      {
        canPickMany: true,
        placeHolder: "Select keys to copy",
      }
    );

    if (!selected || selected.length === 0) {
      return;
    }

    const format = await vscode.window.showQuickPick(
      ["Copy keys", "Copy key=value"],
      { placeHolder: "Choose format" }
    );

    if (!format) {
      return;
    }

    const result =
      format === "Copy keys" ? selected.map((s) => s.split("=")[0]) : selected;

    await vscode.env.clipboard.writeText(result.join("\n"));
    vscode.window.showInformationMessage(`Copied ${result.length} keys.`);
  });

  context.subscriptions.push(disposable);

  // Status bar item
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
