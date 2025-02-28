// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const regex = /\(inroom (.*?)_\d+ (.*?)\)/g;
	let decorationMap = new Map<string, vscode.TextEditorDecorationType>();

	function updateDecorations() {
		// Log the call
		const editor = vscode.window.activeTextEditor;
		if (!editor || !editor.document.fileName.endsWith('.bddl')) return; // Check for .bddl extension

		const text = editor.document.getText();
		let match;
		const uniqueMatches = new Set<string>();

		// Find all unique matches from the first capturing group
		while ((match = regex.exec(text)) !== null) {
			uniqueMatches.add(match[1]);
		}

		// Find the positions of (:init and (:goal
		// This would be used to temporarily exclude matches within these sections
		const initIndex = -1; // text.indexOf('(:init');
		const goalIndex = -1; // text.indexOf('(:goal');

		// Assign a unique color to each match
		let colors = generateColors(uniqueMatches.size);
		let index = 0;

		uniqueMatches.forEach((match) => {
			const color = colors[index++];
			const decorationType = vscode.window.createTextEditorDecorationType({
				backgroundColor: color,
				borderRadius: '4px'
			});

			decorationMap.set(match, decorationType);
		});

		// Clear the ranges for each of the decorations
		decorationMap.forEach((decorationType) => {
			editor.setDecorations(decorationType, []);
		});

		// Apply decorations
		decorationMap.forEach((decorationType, match) => {
			const ranges: vscode.Range[] = [];
			let startIndex = 0;
			while ((startIndex = text.indexOf(match, startIndex)) !== -1) {
				const startPos = editor.document.positionAt(startIndex);
				const endPos = editor.document.positionAt(startIndex + match.length);

				// Only add ranges outside the (:init and (:goal range and where the previous character is
				// either a space or a question mark.
				if (initIndex === -1 || goalIndex === -1 || startIndex < initIndex || startIndex > goalIndex) {
					const prevChar = startIndex > 0 ? text[startIndex - 1] : '';
					if (prevChar === ' ' || prevChar === '?') {
						ranges.push(new vscode.Range(startPos, endPos));
					}
				}
				startIndex += match.length;
			}
			editor.setDecorations(decorationType, ranges);
		});
	}

	// Generate distinct colors
	function generateColors(count: number): string[] {
		let colors: string[] = [];
		for (let i = 0; i < count; i++) {
			let hue = (i * 137) % 360; // Spread colors evenly
			colors.push(`hsl(${hue}, 100%, 80%)`);
		}
		return colors;
	}

	// Trigger decorations on active text change
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const helloworld = () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from bddl-utils!');
	};

	context.subscriptions.push(
		vscode.commands.registerCommand('bddl-utils.wrapExistentialQuantifier', helloworld),
		vscode.commands.registerCommand('bddl-utils.highlightMatches', updateDecorations),
		vscode.window.onDidChangeActiveTextEditor(() => updateDecorations()),
		vscode.window.onDidChangeVisibleTextEditors(() => updateDecorations()),
		vscode.workspace.onDidChangeTextDocument(() => updateDecorations()),
		vscode.workspace.onDidOpenTextDocument(() => updateDecorations())
	);

	// Ensure decorations run when the extension first activates
	updateDecorations();

	console.log('bddl-utils is now activated!');
}

// This method is called when your extension is deactivated
export function deactivate() { }
