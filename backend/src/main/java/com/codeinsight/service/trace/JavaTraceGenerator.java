package com.codeinsight.service.trace;

import com.codeinsight.model.ExecutionTrace;
import com.codeinsight.model.FunctionFrame;
import com.codeinsight.model.VariableSnapshot;
import com.sun.jdi.*;
import com.sun.jdi.connect.AttachingConnector;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.event.*;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.StepRequest;

import java.io.*;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JavaTraceGenerator implements TraceGenerator {

    private String extractClassName(String code) {
        Pattern pattern = Pattern.compile("(?:public\\s+)?class\\s+(\\w+)");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "Main";
    }

    private int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    @Override
    public List<ExecutionTrace> generateTrace(String code, String input) {
        Path tempDir = null;
        Process targetProcess = null;
        VirtualMachine vm = null;
        List<ExecutionTrace> traces = new ArrayList<>();
        
        try {
            tempDir = Files.createTempDirectory("codeinsight_java_trace_");
            String className = extractClassName(code);
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, code);

            // 1. Compile Java source with debug symbols (-g)
            ProcessBuilder compilePb = new ProcessBuilder("javac", "-g", sourceFile.toString());
            Process compileProcess = compilePb.start();
            boolean compileCompleted = compileProcess.waitFor(10, java.util.concurrent.TimeUnit.SECONDS);
            
            if (!compileCompleted || compileProcess.exitValue() != 0) {
                StringBuilder compileErr = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(compileProcess.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        compileErr.append(line).append("\n");
                    }
                } catch (IOException ignored) {}
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(compileProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        compileErr.append(line).append("\n");
                    }
                } catch (IOException ignored) {}
                String errorMsg = compileErr.toString().trim();
                if (errorMsg.isEmpty()) {
                    errorMsg = "Compilation failed or timed out (exit code: " + (compileCompleted ? compileProcess.exitValue() : "timeout") + ").";
                }
                return createErrorTrace("Compilation Error:\n" + errorMsg, code);
            }

            // 2. Locate an available port for JDWP socket attachment
            int debugPort = findFreePort();

            // 3. Spawning target JVM in JDWP server suspend mode
            ProcessBuilder runPb = new ProcessBuilder(
                "java",
                "-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=127.0.0.1:" + debugPort,
                "-cp", tempDir.toString(),
                className
            );
            
            targetProcess = runPb.start();
            final Process finalProcess = targetProcess;

            // Feed input to targetProcess stdin
            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(finalProcess.getOutputStream()))) {
                    writer.write(input);
                    if (!input.endsWith("\n")) {
                        writer.write("\n");
                    }
                    writer.flush();
                } catch (IOException ignored) {}
            }

            // Read target process stdout and stderr asynchronously
            StringBuilder consoleOut = new StringBuilder();
            StringBuilder consoleErr = new StringBuilder();
            
            Thread outReaderThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        consoleOut.append(line).append("\n");
                    }
                } catch (IOException ignored) {}
            });
            
            Thread errReaderThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        consoleErr.append(line).append("\n");
                    }
                } catch (IOException ignored) {}
            });
            
            outReaderThread.start();
            errReaderThread.start();

            // Allow JDWP server socket to open
            VirtualMachineManager vmm = Bootstrap.virtualMachineManager();
            AttachingConnector connector = null;
            for (AttachingConnector ac : vmm.attachingConnectors()) {
                if (ac.transport().name().equals("dt_socket")) {
                    connector = ac;
                    break;
                }
            }

            if (connector == null) {
                throw new IllegalStateException("Socket attaching connector not found");
            }

            Map<String, Connector.Argument> arguments = connector.defaultArguments();
            arguments.get("hostname").setValue("127.0.0.1");
            arguments.get("port").setValue(String.valueOf(debugPort));

            // Retry attachment loop to handle variable JVM startup times on Windows
            Exception lastAttachError = null;
            for (int attempt = 0; attempt < 10; attempt++) {
                try {
                    vm = connector.attach(arguments);
                    break;
                } catch (Exception e) {
                    lastAttachError = e;
                    Thread.sleep(250);
                }
            }

            if (vm == null) {
                throw new IllegalStateException("Could not attach to target JVM: " + (lastAttachError != null ? lastAttachError.getMessage() : "Timeout"));
            }

            // 5. Setup Step Event Requests on VM start
            EventRequestManager erm = vm.eventRequestManager();
            
            // Listen for thread starts to set line stepping
            vm.resume();
            
            EventQueue eventQueue = vm.eventQueue();
            boolean running = true;
            int stepCount = 0;
            int maxSteps = 1000;
            
            while (running && stepCount < maxSteps) {
                EventSet eventSet = eventQueue.remove(3000);
                if (eventSet == null) {
                    break;
                }
                
                for (Event event : eventSet) {
                    if (event instanceof VMStartEvent) {
                        ThreadReference thread = ((VMStartEvent) event).thread();
                        createStepRequest(erm, thread);
                    } else if (event instanceof StepEvent) {
                        StepEvent stepEvent = (StepEvent) event;
                        ThreadReference thread = stepEvent.thread();
                        String tName = "";
                        try {
                            tName = thread.name();
                        } catch (Exception ignored) {}

                        if ("main".equals(tName)) {
                            Location loc = stepEvent.location();
                            
                            // Only trace user class code, skipping java.lang and system routines
                            String declName = loc.declaringType().name();
                            if (declName.equals(className) || declName.startsWith(className + "$") || declName.contains(className)) {
                                stepCount++;
                                ExecutionTrace traceStep = recordJavaStep(stepCount, stepEvent, code, consoleOut.toString());
                                traces.add(traceStep);
                            }
                            
                            // Request next step
                            createStepRequest(erm, thread);
                        }
                    } else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                        running = false;
                        break;
                    }
                }
                vm.resume();
            }
            
            // Wait for target JVM process to terminate and grab final streams
            try {
                targetProcess.waitFor(2, java.util.concurrent.TimeUnit.SECONDS);
                outReaderThread.join(500);
                errReaderThread.join(500);
            } catch (Exception ignored) {}

            // Append runtime exceptions if they occurred (like InputMismatchException)
            if (!consoleErr.toString().trim().isEmpty()) {
                String errMsg = consoleErr.toString().trim();
                if (errMsg.contains("java.util.NoSuchElementException")) {
                    // Do not mark as ERROR since it's just waiting for the next stdin inputs
                } else {
                    if (traces.isEmpty()) {
                        return createErrorTrace(errMsg, code);
                    } else {
                        ExecutionTrace lastTrace = traces.get(traces.size() - 1);
                        lastTrace.setExecutionStatus("ERROR");
                        lastTrace.setCurrentConsoleOutput(lastTrace.getCurrentConsoleOutput() + "\n" + errMsg);
                    }
                }
            }

            // 6. Post process and calculate differences
            PythonTraceGenerator.postProcessTraces(traces, 100);

        } catch (Exception e) {
            return createErrorTrace("Java Trace Engine failed: " + e.getMessage(), code);
        } finally {
            if (vm != null) {
                try { vm.dispose(); } catch (Exception ignored) {}
            }
            if (targetProcess != null) {
                targetProcess.destroyForcibly();
            }
            cleanup(tempDir);
        }
        
        return traces.isEmpty() ? createErrorTrace("No executable trace events were captured.", code) : traces;
    }

    private void createStepRequest(EventRequestManager erm, ThreadReference thread) {
        erm.deleteEventRequests(erm.stepRequests());
        StepRequest sr = erm.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
        sr.addClassExclusionFilter("java.*");
        sr.addClassExclusionFilter("javax.*");
        sr.addClassExclusionFilter("sun.*");
        sr.addClassExclusionFilter("com.sun.*");
        sr.addClassExclusionFilter("jdk.*");
        sr.setSuspendPolicy(EventRequest.SUSPEND_ALL);
        sr.enable();
    }

    private String formatJdiValue(Value val) {
        if (val == null) return "null";
        if (val instanceof StringReference) {
            return "\"" + ((StringReference) val).value() + "\"";
        }
        if (val instanceof ArrayReference) {
            ArrayReference arr = (ArrayReference) val;
            StringBuilder sb = new StringBuilder("[");
            List<Value> vals = arr.getValues();
            for (int i = 0; i < vals.size(); i++) {
                sb.append(formatJdiValue(vals.get(i)));
                if (i < vals.size() - 1) sb.append(", ");
            }
            sb.append("]");
            return sb.toString();
        }
        if (val instanceof ObjectReference) {
            ObjectReference obj = (ObjectReference) val;
            ReferenceType type = obj.referenceType();
            Field valField = type.fieldByName("value");
            if (valField != null) {
                Value innerVal = obj.getValue(valField);
                if (innerVal != null) {
                    if (innerVal instanceof CharValue) {
                        return "\"" + ((CharValue) innerVal).value() + "\"";
                    }
                    if (innerVal instanceof StringReference) {
                        return "\"" + ((StringReference) innerVal).value() + "\"";
                    }
                    return innerVal.toString();
                }
            }
            return "\"" + obj.toString() + "\"";
        }
        if (val instanceof CharValue) {
            return "\"" + ((CharValue) val).value() + "\"";
        }
        return val.toString();
    }

    private String trySerializeCollection(ObjectReference objRef) {
        ReferenceType refType = objRef.referenceType();
        String typeName = refType.name();
        if (typeName.equals("java.util.Stack") || typeName.equals("java.util.Vector") || typeName.endsWith(".Stack") || typeName.endsWith(".Vector")) {
            Field elementDataField = refType.fieldByName("elementData");
            Field elementCountField = refType.fieldByName("elementCount");
            if (elementDataField != null && elementCountField != null) {
                Value elementDataVal = objRef.getValue(elementDataField);
                Value elementCountVal = objRef.getValue(elementCountField);
                if (elementDataVal instanceof ArrayReference && elementCountVal instanceof IntegerValue) {
                    ArrayReference arrRef = (ArrayReference) elementDataVal;
                    int count = ((IntegerValue) elementCountVal).value();
                    List<Value> elements = arrRef.getValues(0, count);
                    List<String> formatted = new ArrayList<>();
                    for (int k = 0; k < elements.size(); k++) {
                        Value elem = elements.get(k);
                        formatted.add(elem != null ? formatJdiValue(elem) : "null");
                    }
                    return "[" + String.join(", ", formatted) + "]";
                }
            }
        }
        if (typeName.equals("java.util.ArrayList") || typeName.endsWith(".ArrayList")) {
            Field elementDataField = refType.fieldByName("elementData");
            Field sizeField = refType.fieldByName("size");
            if (elementDataField != null && sizeField != null) {
                Value elementDataVal = objRef.getValue(elementDataField);
                Value sizeVal = objRef.getValue(sizeField);
                if (elementDataVal instanceof ArrayReference && sizeVal instanceof IntegerValue) {
                    ArrayReference arrRef = (ArrayReference) elementDataVal;
                    int count = ((IntegerValue) sizeVal).value();
                    List<Value> elements = arrRef.getValues(0, count);
                    List<String> formatted = new ArrayList<>();
                    for (int k = 0; k < elements.size(); k++) {
                        Value elem = elements.get(k);
                        formatted.add(elem != null ? formatJdiValue(elem) : "null");
                    }
                    return "[" + String.join(", ", formatted) + "]";
                }
            }
        }
        if (typeName.equals("java.util.LinkedList") || typeName.endsWith(".LinkedList")) {
            Field sizeField = refType.fieldByName("size");
            Field firstField = refType.fieldByName("first");
            if (sizeField != null && firstField != null) {
                Value sizeVal = objRef.getValue(sizeField);
                Value firstVal = objRef.getValue(firstField);
                if (sizeVal instanceof IntegerValue) {
                    int count = ((IntegerValue) sizeVal).value();
                    List<String> formatted = new ArrayList<>();
                    Value currNode = firstVal;
                    for (int k = 0; k < count; k++) {
                        if (currNode instanceof ObjectReference) {
                            ObjectReference nodeObj = (ObjectReference) currNode;
                            ReferenceType nodeType = nodeObj.referenceType();
                            Field itemField = nodeType.fieldByName("item");
                            Field nextField = nodeType.fieldByName("next");
                            if (itemField != null && nextField != null) {
                                Value itemVal = nodeObj.getValue(itemField);
                                formatted.add(itemVal != null ? formatJdiValue(itemVal) : "null");
                                currNode = nodeObj.getValue(nextField);
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    return "[" + String.join(", ", formatted) + "]";
                }
            }
        }
        return null;
    }

    private String trySerializeCustomObject(ObjectReference objRef) {
        ReferenceType refType = objRef.referenceType();
        String typeName = refType.name();
        
        // Skip JDK standard classes
        if (typeName.startsWith("java.") || typeName.startsWith("javax.") || typeName.startsWith("sun.") || typeName.startsWith("jdk.")) {
            return null;
        }
        
        try {
            List<Field> fields = refType.allFields();
            List<String> entries = new ArrayList<>();
            for (Field f : fields) {
                if (f.isStatic()) continue;
                try {
                    Value val = objRef.getValue(f);
                    String valStr = "null";
                    if (val != null) {
                        if (val instanceof ObjectReference) {
                            valStr = "\"0x" + Long.toHexString(((ObjectReference) val).uniqueID()) + "\"";
                        } else if (val instanceof CharValue) {
                            valStr = "\"" + ((CharValue) val).value() + "\"";
                        } else if (val instanceof BooleanValue) {
                            valStr = String.valueOf(((BooleanValue) val).value());
                        } else {
                            valStr = val.toString();
                        }
                    }
                    entries.add("\"" + f.name() + "\": " + valStr);
                } catch (Exception ignored) {}
            }
            return "{" + String.join(", ", entries) + "}";
        } catch (Exception ignored) {}
        return null;
    }

    private ExecutionTrace recordJavaStep(int stepNum, StepEvent event, String code, String consoleOutput) {
        ExecutionTrace trace = new ExecutionTrace();
        trace.setStepNumber(stepNum);
        
        Location loc = event.location();
        int lineNo = loc.lineNumber();
        trace.setCurrentLineNumber(lineNo);
        
        String[] codeLines = code.split("\\R");
        String lineCode = (lineNo > 0 && lineNo <= codeLines.length) ? codeLines[lineNo - 1] : "";
        trace.setExecutedSourceCode(lineCode);
        trace.setExecutionStatus("SUCCESS");
        trace.setCurrentConsoleOutput(consoleOutput);
        
        List<VariableSnapshot> vars = new ArrayList<>();
        List<FunctionFrame> stack = new ArrayList<>();
        
        try {
            ThreadReference thread = event.thread();
            List<StackFrame> frames = thread.frames();
            
            // Read Call stack
            int depth = 1;
            for (StackFrame frame : frames) {
                if (frame.location().declaringType().name().equals(loc.declaringType().name())) {
                    String funcName = frame.location().method().name();
                    stack.add(new FunctionFrame(funcName, "global", depth++));
                }
            }
            
            // Read local frame variables
            if (!frames.isEmpty()) {
                StackFrame top = frames.get(0);
                for (LocalVariable var : top.visibleVariables()) {
                    Value val = top.getValue(var);
                    String valStr = "null";
                    if (val != null) {
                        if (val instanceof ArrayReference) {
                            ArrayReference arrRef = (ArrayReference) val;
                            List<Value> elements = arrRef.getValues();
                            StringBuilder sb = new StringBuilder("[");
                            for (int k = 0; k < elements.size(); k++) {
                                Value elem = elements.get(k);
                                sb.append(elem != null ? formatJdiValue(elem) : "null");
                                if (k < elements.size() - 1) {
                                    sb.append(", ");
                                }
                            }
                            sb.append("]");
                            valStr = sb.toString();
                        } else if (val instanceof ObjectReference) {
                            String colStr = trySerializeCollection((ObjectReference) val);
                            if (colStr != null) {
                                valStr = colStr;
                            } else {
                                String customStr = trySerializeCustomObject((ObjectReference) val);
                                if (customStr != null) {
                                    valStr = customStr;
                                } else {
                                    valStr = val.toString();
                                }
                            }
                        } else {
                            valStr = val.toString();
                        }
                    }
                    String dtype = var.typeName();
                    String addr = val instanceof ObjectReference ? "0x" + Long.toHexString(((ObjectReference)val).uniqueID()) : "0x0";
                    boolean isRef = val instanceof ObjectReference;
                    
                    vars.add(new VariableSnapshot(
                        var.name(),
                        dtype,
                        valStr,
                        "local",
                        addr,
                        0, 0, 0,
                        isRef
                    ));
                }
            }
        } catch (Exception ignored) {}

        trace.setVariablesAfter(vars);
        trace.setFunctionStack(stack);
        trace.setRecursionDepth(stack.size());
        
        String currentFunc = stack.isEmpty() ? "global" : stack.get(0).getCurrentFunction();
        trace.setCurrentFunction(currentFunc);
        trace.setCurrentScope(currentFunc.equals("main") ? "global" : currentFunc);
        
        return trace;
    }

    private List<ExecutionTrace> createErrorTrace(String msg, String code) {
        List<ExecutionTrace> errs = new ArrayList<>();
        ExecutionTrace trace = new ExecutionTrace();
        trace.setStepNumber(1);
        trace.setCurrentLineNumber(1);
        trace.setExecutedSourceCode("");
        trace.setExecutionStatus("ERROR");
        trace.setCurrentConsoleOutput(msg);
        trace.setCurrentFunction("global");
        trace.setCurrentScope("global");
        errs.add(trace);
        return errs;
    }

    private void cleanup(Path tempDir) {
        if (tempDir != null) {
            try {
                Files.walk(tempDir)
                     .map(Path::toFile)
                     .forEach(File::delete);
            } catch (Exception ignored) {}
        }
    }
}
