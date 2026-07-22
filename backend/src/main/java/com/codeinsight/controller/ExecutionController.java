package com.codeinsight.controller;

import com.codeinsight.dto.CompileRequest;
import com.codeinsight.dto.CompileResult;
import com.codeinsight.dto.ExecutionResult;
import com.codeinsight.dto.RunRequest;
import com.codeinsight.model.ExecutionTrace;
import com.codeinsight.service.ExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ExecutionController {

    private final ExecutionService executionService;

    @Autowired
    public ExecutionController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    @PostMapping("/compile")
    public ResponseEntity<CompileResult> compile(@RequestBody CompileRequest request) {
        CompileResult result = executionService.compile(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/run")
    public ResponseEntity<ExecutionResult> run(@RequestBody RunRequest request) {
        ExecutionResult result = executionService.run(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/trace")
    public ResponseEntity<List<ExecutionTrace>> generateTrace(@RequestBody RunRequest request) {
        List<ExecutionTrace> result = executionService.generateTrace(request);
        return ResponseEntity.ok(result);
    }
}
