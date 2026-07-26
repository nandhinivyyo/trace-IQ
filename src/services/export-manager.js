export function exportTraceJson(traces) {
  if (!traces || traces.length === 0) return;
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(traces, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `traceiq-trace-${Date.now()}.json`,
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportSessionJson(session) {
  if (!session) return;
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(session, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `traceiq-session-${session.id || Date.now()}.json`,
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Searches the DOM for the active SVG elements in the visualization area,
 * wraps them in a valid SVG package, and downloads the file.
 */
export function exportSvgFrame() {
  // Look for the main visual canvas svg container or drawing
  const canvasElement =
    document.getElementById("visual-canvas-container") ||
    document.querySelector(".canvas-drawing-area");
  const svgElement = canvasElement
    ? canvasElement.querySelector("svg")
    : document.querySelector("svg");
  if (!svgElement) {
    alert("Could not locate active visualization graphics frame for export.");
    return;
  }

  try {
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);
    // Add standard XML declaration if missing
    if (
      !svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)
    ) {
      svgString = svgString.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = svgUrl;
    downloadAnchor.download = `traceiq-visualization-${Date.now()}.svg`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(svgUrl);
  } catch (error) {
    console.error("SVG export failed", error);
    alert("SVG graphics serialization failed: " + String(error));
  }
}

/**
 * Renders a complete, beautifully-formatted HTML document in a temporary window,
 * styled with print-friendly CSS rules, and triggers the system Print dialog (Save to PDF).
 */
export function printExecutionReport(
  code,
  language,
  traces,
  bookmarks,
  snapshots,
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(
      "Pop-up blocker is preventing the PDF report from opening. Please allow popups for this domain.",
    );
    return;
  }

  const dateStr = new Date().toLocaleString();
  const stepCount = traces.length;
  const errorSteps = traces.filter((t) => t.executionStatus === "ERROR").length;
  // Format bookmarks list
  const bookmarksHtml = bookmarks
    .map(
      (b) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Step ${b.stepIdx + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="badge ${b.category}">${b.category}</span></td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${b.label}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666; font-size: 11px;">${b.timestamp}</td>
    </tr>
  `,
    )
    .join("");

  // Format snapshots list
  const snapshotsHtml = snapshots
    .map(
      (s) => `
    <div class="snapshot-card">
      <div class="snapshot-header">
        <strong>${s.name}</strong> 
        <span style="font-size: 11px; color:#777;">Step ${s.stepIdx + 1} (${s.timestamp})</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 5px; text-align: left; border-bottom: 1px solid #ddd;">Name</th>
            <th style="padding: 5px; text-align: left; border-bottom: 1px solid #ddd;">Type</th>
            <th style="padding: 5px; text-align: left; border-bottom: 1px solid #ddd;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${s.variablesSnapshot
            .map(
              (v) => `
            <tr>
              <td style="padding: 4px 5px; border-bottom: 1px solid #eee; font-family: monospace;"><b>${v.name}</b></td>
              <td style="padding: 4px 5px; border-bottom: 1px solid #eee; font-family: monospace; color:#666;">${v.datatype}</td>
              <td style="padding: 4px 5px; border-bottom: 1px solid #eee; font-family: monospace; color:#222;">${v.value}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `,
    )
    .join("");

  // Format final console output
  const finalConsole =
    traces.length > 0
      ? traces[traces.length - 1].currentConsoleOutput ||
        "No console outputs recorded."
      : "No trace.";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TraceIQ AI - Program Execution Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          margin: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #22C55E;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #111;
          font-family: monospace;
        }
        .logo span {
          color: #22C55E;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 25px;
          background: #f9f9f9;
          padding: 15px;
          border: 1px solid #e1e1e1;
          border-radius: 4px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #777;
          font-weight: bold;
        }
        .meta-val {
          font-size: 14px;
          font-weight: bold;
          margin-top: 2px;
        }
        h2 {
          font-size: 18px;
          border-bottom: 1px solid #e1e1e1;
          padding-bottom: 5px;
          margin-top: 30px;
          color: #111;
        }
        pre {
          background: #f5f5f5;
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 4px;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 12px;
        }
        th {
          background: #eee;
          padding: 8px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .badge.step { background: #e2e8f0; color: #4a5568; }
        .badge.function { background: #ebf8ff; color: #2b6cb0; }
        .badge.loop { background: #f0fff4; color: #2f855a; }
        .badge.memory { background: #feebc8; color: #c05621; }
        .badge.error { background: #fff5f5; color: #9b2c2c; }
        .badge.custom { background: #faf5ff; color: #6b46c1; }
        
        .snapshot-card {
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 4px;
          background: #fafafa;
          page-break-inside: avoid;
        }
        .snapshot-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        @media print {
          body {
            margin: 20px;
            font-size: 11px;
          }
          .no-print {
            display: none;
          }
          h2 {
            margin-top: 20px;
          }
          pre {
            background: #fff;
            border: 1px solid #aaa;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">TraceIQ<span>AI</span></div>
        <div style="text-align: right;">
          <div style="font-weight: bold;">Execution Trace Report</div>
          <div style="font-size: 11px; color: #666;">Generated: ${dateStr}</div>
        </div>
      </div>

      <div class="no-print" style="margin-bottom: 20px; background: #ebf8ff; color: #2b6cb0; padding: 12px; border-radius: 4px; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
        <span>This is a print preview. Click print or save to PDF to save a hardcopy.</span>
        <button onclick="window.print()" style="background: #2b6cb0; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px;">Print Report</button>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Language</span>
          <span class="meta-val" style="text-transform: capitalize;">${language}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Total Steps</span>
          <span class="meta-val">${stepCount}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Errors Encountered</span>
          <span class="meta-val" style="color: ${errorSteps > 0 ? "red" : "green"};">${errorSteps}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Complexity Bounds</span>
          <span class="meta-val">O(N log N) / O(1)</span>
        </div>
      </div>

      <h2>Program Source Code</h2>
      <pre>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>

      <h2>Execution Timeline Bookmarks</h2>
      ${
        bookmarks.length > 0
          ? `
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Step</th>
              <th style="width: 100px;">Category</th>
              <th>Description</th>
              <th style="width: 100px;">Time</th>
            </tr>
          </thead>
          <tbody>
            ${bookmarksHtml}
          </tbody>
        </table>
      `
          : `<p style="color: #666; font-style: italic;">No bookmarks were saved for this execution session.</p>`
      }

      <h2>Saved Execution Snapshots</h2>
      ${snapshots.length > 0 ? snapshotsHtml : `<p style="color: #666; font-style: italic;">No variable scope snapshots were captured.</p>`}

      <h2>Console Sandboxed Output</h2>
      <pre style="background: #111; color: #eee; font-family: monospace; font-size: 11px;">${finalConsole}</pre>

      <script>
        // Trigger print automatically after a short loading timeout
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
