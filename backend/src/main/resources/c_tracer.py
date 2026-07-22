import sys
import json
import io
import re

class ExecutionTracer:
    def __init__(self, code_str, stdin_inputs=None):
        self.code = code_str
        self.stdin = stdin_inputs if stdin_inputs else []
        self.stdin_idx = 0
        self.steps = []
        self.stdout_buf = io.StringIO()
        self.max_steps = 1000
        self.step_count = 0

    def mock_input(self, prompt=""):
        if self.stdin_idx < len(self.stdin):
            val = self.stdin[self.stdin_idx]
            self.stdin_idx += 1
            return val
        raise EOFError("EOF when reading a line")

    def run(self):
        import builtins
        builtins.input = self.mock_input
        
        original_stdout = sys.stdout
        sys.stdout = self.stdout_buf
        
        # Transpile C/C++ to Python line by line preserving line mapping
        py_lines = transpile_cpp_to_python(self.code)
        py_code = "\n".join(py_lines)
        
        sys.settrace(self.trace_callback)
        try:
            global_scope = {}
            exec(compile(py_code, "<string>", "exec"), global_scope)
            # Invoke main() if defined
            if "main" in global_scope and callable(global_scope["main"]):
                global_scope["main"]()
        except Exception as e:
            pass
        finally:
            sys.settrace(None)
            sys.stdout = original_stdout

    def trace_callback(self, frame, event, arg):
        if self.step_count >= self.max_steps:
            return None
        if frame.f_code.co_filename != "<string>":
            return self.trace_callback

        line_no = frame.f_lineno
        if event in ("line", "call", "return", "exception"):
            self.record_step(line_no, "SUCCESS", frame=frame)
        return self.trace_callback

    def record_step(self, line_no, status, frame=None):
        self.step_count += 1
        variables = []
        stack = []
        depth = 0
        curr_func = "global"

        code_lines = self.code.splitlines()
        executed_code = code_lines[line_no - 1] if 0 < line_no <= len(code_lines) else ""

        if frame:
            # Walk stack
            f = frame
            while f:
                if f.f_code.co_filename == "<string>":
                    stack.append({
                        "currentFunction": f.f_code.co_name,
                        "parentFunction": f.f_back.f_code.co_name if f.f_back and f.f_back.f_code.co_filename == "<string>" else "global",
                        "callDepth": len(stack) + 1,
                        "returnLine": f.f_back.f_lineno if f.f_back and f.f_back.f_code.co_filename == "<string>" else 0
                    })
                f = f.f_back

            for name, val in frame.f_locals.items():
                if name.startswith("__") or name in ("ExecutionTracer", "sys", "json", "io", "transpile_cpp_to_python", "transpile_expr"):
                    continue
                dtype = "int" if isinstance(val, int) else ("float" if isinstance(val, float) else ("list" if isinstance(val, list) else type(val).__name__))
                val_str = str(val)
                addr = f"0x{id(val):x}"
                is_ref = isinstance(val, (list, dict)) or not isinstance(val, (int, float, str, bool, type(None)))

                variables.append({
                    "name": name,
                    "datatype": dtype,
                    "value": val_str,
                    "scope": "local" if frame.f_code.co_name != "<module>" else "global",
                    "memoryAddress": addr,
                    "referenceType": is_ref,
                    "createdStep": 0,
                    "updatedStep": 0,
                    "destroyedStep": 0
                })

            curr_func = frame.f_code.co_name
            depth = len(stack)

        step = {
            "stepNumber": self.step_count,
            "currentLineNumber": line_no,
            "executedSourceCode": executed_code,
            "executionStatus": status,
            "variablesAfter": variables,
            "currentFunction": curr_func if curr_func != "<module>" else "global",
            "recursionDepth": depth,
            "currentConsoleOutput": self.stdout_buf.getvalue(),
            "inputConsumed": "",
            "currentScope": curr_func if curr_func != "<module>" else "global",
            "executionDuration": 0,
            "functionStack": stack
        }
        self.steps.append(step)

def transpile_cpp_to_python(cpp_code):
    lines = cpp_code.splitlines()
    py_lines = []

    indent_level = 0

    for line in lines:
        stripped = line.strip()

        # Handle empty lines
        if not stripped:
            py_lines.append("")
            continue

        # Handle comments
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*") or stripped == "using namespace std;":
            py_comment = "# " + stripped.lstrip("/")
            py_lines.append(" " * (indent_level * 4) + py_comment)
            continue

        # Adjust braces
        if stripped == "{":
            py_lines.append(" " * (indent_level * 4) + "# {")
            continue

        if stripped == "}" or stripped == "};":
            if indent_level > 0:
                indent_level -= 1
            py_lines.append(" " * (indent_level * 4) + "# }")
            continue

        l = stripped
        if l.endswith("{"):
            l = l[:-1].strip()

        # Transpile Function Signatures
        func_match = re.match(r'^(?:inline\s+|static\s+)?(?:int|void|double|float|bool|char|size_t|auto|\w+)\s+(\w+)\s*\((.*)\)', l)
        if func_match and not l.startswith("for") and not l.startswith("while") and not l.startswith("if") and not l.startswith("else"):
            func_name = func_match.group(1)
            raw_args = func_match.group(2)
            args = []
            if raw_args.strip():
                for arg in raw_args.split(','):
                    parts = arg.strip().split()
                    if parts:
                        arg_name = parts[-1].replace('&', '').replace('*', '')
                        arg_name = re.sub(r'\[.*\]', '', arg_name)
                        args.append(arg_name)
            py_line = f"def {func_name}({', '.join(args)}):"
            py_lines.append(" " * (indent_level * 4) + py_line)
            indent_level += 1
            continue

        # Transpile for loops
        for_match = re.match(r'^for\s*\(\s*(?:int|size_t)?\s*(\w+)\s*=\s*([^;]+);\s*\1\s*<\s*([^;]+);\s*[^)]+\)', l)
        if for_match:
            var_name = for_match.group(1)
            start_val = transpile_expr(for_match.group(2))
            end_val = transpile_expr(for_match.group(3))
            py_line = f"for {var_name} in range({start_val}, {end_val}):"
            py_lines.append(" " * (indent_level * 4) + py_line)
            indent_level += 1
            continue

        # Transpile while loops
        while_match = re.match(r'^while\s*\((.*)\)', l)
        if while_match:
            cond = transpile_expr(while_match.group(1))
            py_line = f"while {cond}:"
            py_lines.append(" " * (indent_level * 4) + py_line)
            indent_level += 1
            continue

        # Transpile if / else if / else
        if_match = re.match(r'^if\s*\((.*)\)', l)
        elif_match = re.match(r'^(?:else\s+if|elif)\s*\((.*)\)', l)
        else_match = re.match(r'^else\b', l)

        if if_match:
            cond = transpile_expr(if_match.group(1))
            py_line = f"if {cond}:"
            py_lines.append(" " * (indent_level * 4) + py_line)
            indent_level += 1
            continue
        elif elif_match:
            cond = transpile_expr(elif_match.group(1))
            py_line = f"elif {cond}:"
            py_lines.append(" " * (indent_level * 4) + py_line)
            indent_level += 1
            continue
        elif else_match:
            py_line = "else:"
            py_lines.append(" " * (indent_level * 4) + py_line)
            indent_level += 1
            continue

        # Transpile statement
        stmt = transpile_expr(l.rstrip(';'))
        if stmt:
            py_lines.append(" " * (indent_level * 4) + stmt)
        else:
            py_lines.append(" " * (indent_level * 4) + "# pass")

    return py_lines

def transpile_expr(expr):
    e = expr.strip()
    if not e:
        return "pass"

    e = re.sub(r'^(?:std::)?vector<\w+>\s+(\w+)\s*=\s*\{([^}]+)\}', r'\1 = [\2]', e)
    e = re.sub(r'^(?:int|float|double|char)\s+(\w+)\[\s*\w*\s*\]\s*=\s*\{([^}]+)\}', r'\1 = [\2]', e)
    e = re.sub(r'^(?:const\s+)?(?:int|float|double|char|bool|size_t|auto)\s+(\w+)', r'\1', e)
    e = re.sub(r'(\w+)\.size\(\)', r'len(\1)', e)
    e = re.sub(r'sizeof\(\s*(\w+)\s*\)\s*/\s*sizeof\(\s*\1\[0\]\s*\)', r'len(\1)', e)
    e = re.sub(r'/\s*(\d+)', r'// \1', e)
    e = re.sub(r'\btrue\b', 'True', e)
    e = re.sub(r'\bfalse\b', 'False', e)
    e = re.sub(r'\b(NULL|nullptr)\b', 'None', e)

    if 'cout' in e or 'printf' in e:
        return 'pass'

    return e

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
        
    code_filepath = sys.argv[1]
    stdin_inputs = []
    
    if len(sys.argv) > 2:
        stdin_filepath = sys.argv[2]
        with open(stdin_filepath, "r") as f:
            stdin_inputs = [line.strip() for line in f.readlines()]
            
    with open(code_filepath, "r") as f:
        code_content = f.read()
        
    tracer = ExecutionTracer(code_content, stdin_inputs)
    tracer.run()
    
    print(json.dumps(tracer.steps))
