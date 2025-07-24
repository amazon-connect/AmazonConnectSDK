"use strict";
const fs = require("fs");
const path = require("path");
const { createCoverageMap } = require("istanbul-lib-coverage");
const libReport = require("istanbul-lib-report");
const reports = require("istanbul-reports");

class MonorepoCoverageGenerator {
  constructor(options = {}) {
    this.language = options.language || "typescript";
    this._coverageMap = createCoverageMap({});
  }

  aggregateCoverageFromWorkspaces(rootDir = process.cwd()) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
    );

    for (const workspace of packageJson.workspaces || []) {
      const coveragePath = path.join(
        rootDir,
        workspace,
        "coverage",
        "coverage-final.json",
      );
      if (fs.existsSync(coveragePath)) {
        this.processCoverageFile(coveragePath, rootDir);
      }
    }

    this.generateReports(rootDir);
  }

  processCoverageFile(coverageFilePath, rootDir) {
    const coverageData = JSON.parse(fs.readFileSync(coverageFilePath, "utf8"));
    const transformed = {};

    for (const [filePath, fileData] of Object.entries(coverageData)) {
      const relativePath = filePath.startsWith(rootDir)
        ? path.relative(rootDir, filePath).replace(/\\/g, "/")
        : filePath;
      transformed[relativePath] = { ...fileData, path: relativePath };
    }

    this._coverageMap.merge(createCoverageMap(transformed));
  }

  generateReports(rootDir) {
    const outputDir = path.join(
      rootDir,
      "build",
      "brazil-documentation",
      "coverage",
    );
    fs.mkdirSync(outputDir, { recursive: true });

    const context = libReport.createContext({
      dir: outputDir,
      coverageMap: this._coverageMap,
    });

    // Generate standard reports
    reports.create("html").execute(context);
    reports.create("lcov").execute(context);
    reports.create("clover").execute(context);
    reports.create("json").execute(context);

    // Generate original format for backwards compatibility
    const { statements, branches } = this.extractStatementsAndBranches();
    const coverageData = `${this.language}:line:${this.coverage(statements)}\n${this.language}:branch:${this.coverage(branches)}\n`;

    fs.mkdirSync(path.join(rootDir, "build", "generated-make"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(rootDir, "build", "generated-make", "coverage-data.txt"),
      coverageData,
    );
  }

  extractStatementsAndBranches() {
    const data = Array.from(Object.values(this._coverageMap.data));
    return {
      statements: data
        .map((r) => r.s)
        .reduce((acc, curr) => acc.concat(Object.entries(curr)), []),
      branches: data
        .map((r) => r.b)
        .reduce((acc, curr) => acc.concat(Object.entries(curr)), []),
    };
  }

  coverage(entries) {
    if (entries.length === 0) return 0;
    const covered = entries
      .map((entry) => entry[1])
      .reduce((s, i) => (i === 0 ? s : s + 1), 0);
    return (covered / entries.length) * 100;
  }
}

if (require.main === module) {
  try {
    new MonorepoCoverageGenerator({
      language: "typescript",
    }).aggregateCoverageFromWorkspaces();
    console.log("✅ Coverage reports generated!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

module.exports = MonorepoCoverageGenerator;
