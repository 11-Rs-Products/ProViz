
export class CodeRunner {
    constructor(visualizerAPI) {
        this.visualizerAPI = visualizerAPI;
        this.pyodide = null;
        this.isReady = false;
    }

    async init() {
        if (this.isReady) return;
        
        console.log("Loading Pyodide...");
        this.pyodide = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        // Expose visualizer API to Python globally
        window.vAPI = this.visualizerAPI;
        
        // Python wrapper to interact with window.vAPI easily
        await this.pyodide.runPythonAsync(`
import js

class Visualizer:
    def spawn(self, id, value, colorKey="DEFAULT", x=0, y=0, z=0):
        js.window.vAPI.spawn(id, value, colorKey, x, y, z)
        
    def remove(self, id):
        js.window.vAPI.remove(id)
        
    def update(self, id, new_value, colorKey=None):
        js.window.vAPI.update(id, new_value, colorKey)
        
    def move(self, id, target_x, target_y, target_z):
        js.window.vAPI.move(id, target_x, target_y, target_z)
        
    def highlight(self, id, colorKey):
        js.window.vAPI.highlight(id, colorKey)

# Global instance for the user
visualizer = Visualizer()
        `);
        
        this.isReady = true;
        console.log("Pyodide Ready!");
    }

    async runCode(pythonCode) {
        if (!this.isReady) {
            throw new Error("Pyodide is not initialized yet.");
        }
        
        this.visualizerAPI.clearAll();
        
        try {
            await this.pyodide.runPythonAsync(pythonCode);
            return { success: true };
        } catch (error) {
            console.error("Python Execution Error:", error);
            return { success: false, error: error.message };
        }
    }
}
