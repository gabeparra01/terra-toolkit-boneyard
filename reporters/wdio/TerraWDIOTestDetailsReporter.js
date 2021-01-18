const events = require("events");
const path = require("path");
const fs = require("fs");
class TerraWDIOTestDetailsReporter extends events.EventEmitter {
  constructor(globalConfig, options) {
    super(globalConfig);
    this.options = options;
    this.fileName = "";
    this.resultJsonObject = {
      locale: "",
      theme: "",
      formFactor: "",
      browser: "",
      suites: {},
    };
    this.moduleName = ''
    this.setResultsDir.bind(this);
    this.hasResultsDir.bind(this);
    this.setTestModule = this.setTestModule.bind(this);
    this.description = "";
    this.success = "";
    this.screenshotLink = "";
    this.specHashData = {};
    this.nonMonoRepoResult = [];
    this.resultsDir = "";

    this.on("terra-wdio:latest-screenshot", (screenshotPath) => {
      this.screenshotLink = screenshotPath;
    });

    this.on("runner:start", (runner) => {
      const filePathLocation1 = path.join(
        this.resultsDir,
        `runner_start.json`
      );
      fs.writeFileSync(
        filePathLocation1,
        `${JSON.stringify(this.runner, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      this.setTestModule(runner.specs[0]);
      this.setResultsDir();
      this.hasResultsDir();
      this.resultJsonObject.locale = runner.config.locale;
      this.resultJsonObject.browser = runner.config.browserName;
      this.resultJsonObject.formFactor = runner.config.formFactor;
      this.resultJsonObject.theme =
        runner.capabilities.theme || "default-theme";
      this.fileNameCheck(runner.config, runner.capabilities);

    });

    /**
    * Format class member specHashData with runner's specHash. If its monorepo formatting the specHash inside the moduleName
    * @param {Object} params
    * @return null
    */
    this.on("suite:start", (params) => {
      const filePathLocation2 = path.join(
        this.resultsDir,
        `suit_start.json`
      );
      fs.writeFileSync(
        filePathLocation2,
        `${JSON.stringify(this.params, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      const { specHash, title, parent } = params
      let specHashData = this.specHashData
      if (this.moduleName) {
        if (!this.specHashData[this.moduleName]) {
          this.specHashData[this.moduleName] = {}
          specHashData = this.specHashData
        }
        if (!specHashData[this.moduleName][specHash]) {
          specHashData[this.moduleName][specHash] = {}
        }
  
        if (!specHashData[this.moduleName][specHash][title]) {
          specHashData[this.moduleName][specHash][title] = {
            parent,
            description: title,
            tests: []
          }
        }
      } else {
        if (!specHashData[specHash]) {
          specHashData[specHash] = {}
        }
        if (!specHashData[specHash][title]) {
          specHashData[specHash][title] = {
            parent,
            description: title,
            tests: []
          }
        }
      }
    });

    this.on("test:start", (test) => {
      const filePathLocation3 = path.join(
        this.resultsDir,
        `test_start.json`
      );
      fs.writeFileSync(
        filePathLocation3,
        `${JSON.stringify(this.test, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      this.description = test.title;
    });

    this.on("test:pass", (test) => {
      const filePathLocation4 = path.join(
        this.resultsDir,
        `test_pass.json`
      );
      fs.writeFileSync(
        filePathLocation4,
        `${JSON.stringify(this.test, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      this.success = "success";
    });

    this.on("test:fail", (test) => {
      const filePathLocation5 = path.join(
        this.resultsDir,
        `test_fail.json`
      );
      fs.writeFileSync(
        filePathLocation5,
        `${JSON.stringify(this.test, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      this.success = "fail";
    });

    /**
    * update specHashData with description, success, screenshotLink 
    * @param {Object} test 
    * @return null
    */
    this.on("test:end", (test) => {
      const filePathLocation6 = path.join(
        this.resultsDir,
        `test_end.json`
      );
      fs.writeFileSync(
        filePathLocation6,
        `${JSON.stringify(this.test, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      const { specHash, parent } = test
      if(this.moduleName) {
        if (this.specHashData[this.moduleName][specHash]) {
          if (this.specHashData[this.moduleName][specHash][parent]) {
            this.specHashData[this.moduleName][specHash][parent].tests.push({
              description: this.description,
              success: this.success,
              screenshotLink: this.screenshotLink.screenshotPath,
            })
          }
        }
      }
      else {
        if (this.specHashData[specHash]) {
          if (this.specHashData[specHash][parent]) {
            this.specHashData[specHash][parent].tests.push({
              description: this.description,
              success: this.success,
              screenshotLink: this.screenshotLink.screenshotPath,
            })
          }
        }
      }
      
    });

    /**
    * Format resultJsonObject based on parent and nest the tests
    * @return null
    */
    this.on("runner:end", (runner) => {
      const filePathLocation7 = path.join(
        this.resultsDir,
        `runner_end.json`
      );
      fs.writeFileSync(
        filePathLocation7,
        `${JSON.stringify(this.runner, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      const specData = this.moduleName ? this.specHashData[this.moduleName] : this.specHashData
      Object.values(specData).forEach((spec, i) => {
        const revSpecs = Object.values(spec)
        revSpecs.forEach((test) => {
          if (test.parent !== test.description) {
            const parentIndex = revSpecs.findIndex(item => item.description === test.parent)
            if (parentIndex > -1) {
              revSpecs[parentIndex].tests.push(test);
              delete test.parent;
            }
          }
          delete test.parent;
        })
        if (this.moduleName) {
          this.resultJsonObject.suites[this.moduleName] = revSpecs.shift();
        }
        else {
          this.nonMonoRepoResult.push(revSpecs.shift());
        }
      })
      if (!this.moduleName) {
        this.resultJsonObject.suites = this.nonMonoRepoResult;
      }
      const filePathLocation = path.join(
        this.resultsDir,
        `${this.fileName}.json`
      );
      fs.writeFileSync(
        filePathLocation,
        `${JSON.stringify(this.resultJsonObject, null, 2)}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            Logger.error(err.message, { context: LOG_CONTEXT });
          }
        }
      );
      this.specHashData = {}
    });
  }

  /**
  * Set the package name to moduleName property if specsValue contains /package string
  * @param {string} specsValue - File path of current spec file from runners
  * @return null
  */
  setTestModule(specsValue) {
    const index = specsValue.lastIndexOf('packages/');
    if (index > -1) {
      const testFilePath = specsValue.substring(index).split(path.sep);
      const moduleName = testFilePath && testFilePath[1] ? testFilePath[1] : process.cwd().split(path.sep).pop();
      if (moduleName && moduleName !== this.moduleName) {
        this.moduleName = moduleName;
      }
    }
  }

  /**
   * Check and create reports dir if doesn't exist
   * @return null
   */
  hasResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true }, (err) => {
        if (err) {
          Logger.error(err.message, { context: LOG_CONTEXT });
        }
      });
    }
  }

  /**
   * Sets results directory for the test run. Uses the wdio reporterOptions.detailsReporter if set, otherwise
   * it outputs to tests?/wdio/reports/details.
   * @return null;
   */
  setResultsDir() {
    const { reporterOptions } = this.options;
    if (reporterOptions && reporterOptions.detailsReporter) {
      this.resultsDir = reporterOptions.detailsReporter;
    } else {
      let testDir = 'tests';
      if (fs.existsSync(path.join(process.cwd(), 'test'))) {
        testDir = 'test';
      }
      this.resultsDir = path.join(process.cwd(), testDir, 'wdio', 'reports', 'details');
    }
  }

  /**
  * Formatting the filename based on locale, theme, and formFactor
  * @return null
  */
  fileNameCheck({ formFactor, locale, theme }, { browserName }) {
    const fileNameConf = ["result-details"];
    if (locale) {
      fileNameConf.push(locale);
      this.resultJsonObject.locale = locale;
    }

    if (theme) {
      fileNameConf.push(theme);
      this.resultJsonObject.theme = theme;
    }

    if (formFactor) {
      fileNameConf.push(formFactor);
      this.resultJsonObject.formFactor = formFactor;
    }

    if (browserName) {
      fileNameConf.push(browserName);
      this.resultJsonObject.browser = browserName;
    }

    this.fileName = fileNameConf.join("-");
  }
}

TerraWDIOTestDetailsReporter.reporterName = "TerraWDIOTestDetailsReporter";
module.exports = TerraWDIOTestDetailsReporter;