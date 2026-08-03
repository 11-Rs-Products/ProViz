
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
import sys

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

class PythonTracer:
    def __init__(self):
        self.steps = []
    def trace(self, frame, event, arg):
        try:
            if frame.f_code.co_name == "__run_traced":
                return self.trace
            if event == 'line':
                curr = {}
                for k, v in frame.f_locals.items():
                    if not k.startswith('_') and not callable(v) and 'module' not in str(type(v)):
                        if k not in ['js', 'sys', 'visualizer', 'tracer', '__user_code__']:
                            try:
                                val_str = str(v)
                                if len(val_str) > 20: val_str = val_str[:17] + "..."
                                curr[k] = val_str
                            except Exception:
                                curr[k] = "<Error converting value>"
                self.steps.append({
                    "line": frame.f_lineno, 
                    "locals": curr,
                    "q_len": len(js.window.vAPI.actionQueue)
                })
        except Exception as e:
            js.console.error("Tracer Error:", str(e))
        return self.trace

tracer = PythonTracer()
        `);
        
        this.isReady = true;
        console.log("Pyodide Ready!");
    }

    async runCode(pythonCode) {
        if (!this.isReady) {
            throw new Error("Pyodide is not initialized yet.");
        }
        
        try {
            this.pyodide.globals.set('__user_code__', pythonCode);
            await this.pyodide.runPythonAsync(`
import sys
def __run_traced():
    sys.settrace(tracer.trace)
    try:
        user_globals = { 'js': js, 'sys': sys, 'visualizer': visualizer, 'tracer': tracer, '__builtins__': __builtins__ }
        exec(__user_code__, user_globals)
        js.console.log("Executed user code. Steps so far:", len(tracer.steps))
    finally:
        sys.settrace(None)
__run_traced()
            `);
            
            const stepsProxy = this.pyodide.globals.get('tracer').steps;
            const steps = stepsProxy.toJs({ dict_converter: Object.fromEntries });
            stepsProxy.destroy();
            await this.pyodide.runPythonAsync("tracer.steps = []");
            
            return { success: true, steps: steps };
        } catch (error) {
            await this.pyodide.runPythonAsync("sys.settrace(None)");
            console.error("Python Execution Error:", error);
            return { success: false, error: error.message };
        }
    }
}
