import sys
import io

# Copy the Executer logic to test it and print errors
sys.path.append(r"c:\final-yr-proj\backend\src\main\resources")
import c_tracer

with open(r"c:\final-yr-proj\scratch\c_test.c", "r") as f:
    code = f.read()

tracer = c_tracer.ExecutionTracer(code)
# Manual run with print exceptions
import builtins
builtins.input = tracer.mock_input
original_stdout = sys.stdout
sys.stdout = tracer.stdout_buf

py_lines = c_tracer.transpile_cpp_to_python(tracer.code)
py_code = "\n".join(py_lines)

sys.settrace(tracer.trace_callback)
try:
    global_scope = {}
    exec(compile(py_code, "<string>", "exec"), global_scope)
    if "main" in global_scope and callable(global_scope["main"]):
        global_scope["main"]()
except Exception as e:
    sys.settrace(None)
    sys.stdout = original_stdout
    import traceback
    print("EXCEPTION THROWN:")
    traceback.print_exc()
    sys.exit(1)
finally:
    sys.settrace(None)
    sys.stdout = original_stdout

print(f"Recorded steps count: {len(tracer.steps)}")
