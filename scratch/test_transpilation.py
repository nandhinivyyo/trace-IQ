import sys
sys.path.append(r"c:\final-yr-proj\backend\src\main\resources")
from c_tracer import transpile_cpp_to_python

with open(r"c:\final-yr-proj\scratch\c_test.c", "r") as f:
    code = f.read()

py_lines = transpile_cpp_to_python(code)
for idx, line in enumerate(py_lines):
    print(f"{idx+1:2d}: {line}")
