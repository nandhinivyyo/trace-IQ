import sys
import json
import io

class ExecutionTracer:
    def __init__(self, code_str, stdin_inputs=None):
        self.code = code_str
        self.stdin = stdin_inputs if stdin_inputs else []
        self.stdin_idx = 0
        self.steps = []
        self.stdout_buf = io.StringIO()
        self.max_steps = 1000
        self.step_count = 0
        self.original_input = input
        
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
        sys.settrace(self.trace_callback)
        
        try:
            global_scope = {}
            exec(compile(self.code, "<string>", "exec"), global_scope)
        except Exception as e:
            tb = e.__traceback__
            line = 1
            if tb:
                while tb.tb_next:
                    tb = tb.tb_next
                line = tb.tb_lineno
            self.record_step(line, "EXCEPTION", frame=None)
        finally:
            sys.settrace(None)
            sys.stdout = original_stdout
            builtins.input = self.original_input
            
    def trace_callback(self, frame, event, arg):
        if self.step_count >= self.max_steps:
            raise RuntimeError("Maximum execution steps exceeded (infinite loop protection)")
            
        if frame.f_code.co_filename != "<string>":
            return self.trace_callback
            
        line_no = frame.f_lineno
        if event in ("line", "call", "return", "exception"):
            status = "SUCCESS"
            if event == "exception":
                status = "EXCEPTION"
            self.record_step(line_no, status, frame=frame, event=event)
            
        return self.trace_callback

    def record_step(self, line_no, status, frame=None, event=None):
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
            
            # Read variables & Scan Heap
            heap_objects = {}
            visited_ids = set()

            def scan_heap(val):
                if val is None or isinstance(val, (int, float, str, bool)):
                    return
                val_id = id(val)
                if val_id in visited_ids:
                    return
                visited_ids.add(val_id)

                addr = f"0x{val_id:x}"
                dtype = type(val).__name__

                # Ignore standard modules or methods
                if dtype in ("function", "builtin_function_or_method", "module", "classobj", "type"):
                    return

                if hasattr(val, "__dict__"):
                    # Custom class instance
                    fields = {}
                    for k, v in val.__dict__.items():
                        if k.startswith("__"):
                            continue
                        if v is None or isinstance(v, (int, float, str, bool)):
                            fields[k] = v
                        else:
                            fields[k] = f"0x{id(v):x}"
                            scan_heap(v)
                    heap_objects[addr] = {
                        "name": f"heap_{dtype}",
                        "datatype": dtype,
                        "value": str(fields),
                        "scope": "heap",
                        "memoryAddress": addr,
                        "referenceType": True,
                        "createdStep": 0,
                        "updatedStep": 0,
                        "destroyedStep": 0
                    }
                elif isinstance(val, list):
                    # List containing potential references
                    elements = []
                    for item in val:
                        if item is None or isinstance(item, (int, float, str, bool)):
                            elements.append(item)
                        else:
                            elements.append(f"0x{id(item):x}")
                            scan_heap(item)
                    heap_objects[addr] = {
                        "name": "heap_list",
                        "datatype": "list",
                        "value": str(elements),
                        "scope": "heap",
                        "memoryAddress": addr,
                        "referenceType": True,
                        "createdStep": 0,
                        "updatedStep": 0,
                        "destroyedStep": 0
                    }
                elif isinstance(val, dict):
                    # Dict containing potential references
                    fields = {}
                    for k, v in val.items():
                        if v is None or isinstance(v, (int, float, str, bool)):
                            fields[k] = v
                        else:
                            fields[k] = f"0x{id(v):x}"
                            scan_heap(v)
                    heap_objects[addr] = {
                        "name": "heap_dict",
                        "datatype": "dict",
                        "value": str(fields),
                        "scope": "heap",
                        "memoryAddress": addr,
                        "referenceType": True,
                        "createdStep": 0,
                        "updatedStep": 0,
                        "destroyedStep": 0
                    }

            for name, val in frame.f_locals.items():
                if name.startswith("__") or name in ("ExecutionTracer", "sys", "json", "io"):
                    continue
                dtype = type(val).__name__
                addr = f"0x{id(val):x}"
                is_ref = not isinstance(val, (int, float, str, bool, type(None)))
                if isinstance(val, (list, tuple, dict, set)):
                    val_str = str(val)
                elif is_ref:
                    val_str = f"0x{id(val):x}"
                else:
                    val_str = str(val)
                
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
                scan_heap(val)
            
            variables.extend(heap_objects.values())
            
            curr_func = frame.f_code.co_name
            depth = len(stack)

        loop_info = None
        if executed_code.strip().startswith("for ") or executed_code.strip().startswith("while "):
            loop_info = {
                "loopType": "for" if executed_code.strip().startswith("for ") else "while",
                "outerLoopNumber": 1,
                "innerLoopNumber": 0,
                "iterationNumber": self.step_count,
                "maxIteration": 1000,
                "loopVariables": {},
                "conditionResult": "true"
            }

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
            "currentScope": f"{curr_func}" if curr_func != "<module>" else "global",
            "executionDuration": 0,
            "loopInformation": loop_info,
            "functionStack": stack
        }
        
        self.steps.append(step)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
        
    code_filepath = sys.argv[1]
    stdin_inputs = []
    
    if len(sys.argv) > 2:
        # Read inputs from args or stdin parameter
        stdin_filepath = sys.argv[2]
        with open(stdin_filepath, "r") as f:
            stdin_inputs = [line.strip() for line in f.readlines()]
            
    with open(code_filepath, "r") as f:
        code_content = f.read()
        
    tracer = ExecutionTracer(code_content, stdin_inputs)
    tracer.run()
    
    print(json.dumps(tracer.steps))
