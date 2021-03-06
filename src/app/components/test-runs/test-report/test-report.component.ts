import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { TestModulesService, TestRunsService, TestResultsService, TestCasesService, ExpectedResultsService, TestIssuesService, HandleErrorService } from '@services';
import { TestRun, TestModule, TestCase, TestResult, TestIssue } from '@models';
import { TestResultStatus, Priority } from '../../../enums';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-test-report',
  templateUrl: './test-report.component.html',
  styleUrls: ['./test-report.component.scss']
})
export class TestReportComponent implements OnInit {
  hasIssues: boolean = false;
  resultsChart = [];
  totalsChart = [];
  modulesChart = [];

  isLoading: boolean = false;
  testRun: TestRun;
  testRunId: number;
  testResults: TestResult[] = [];
  testCases: TestCase[] = [];
  testModules: TestModule[];
  testResultStatus = TestResultStatus;
  priority = Priority;
  totalTestCases: number = 0;
  totalAutomated: number = 0;
  totalPassCount: number = 0;
  totalFailCount: number = 0;
  totalCntCount: number = 0;
  totalNaCount: number = 0;
  totalPendingCount: number = 0;

  constructor(
    private handleErrorService: HandleErrorService,
    private expectedResultsService: ExpectedResultsService,
    private testIssuesService: TestIssuesService,
    private testRunsService: TestRunsService,
    private testModulesService: TestModulesService,
    private testCasesService: TestCasesService,
    private testResultsService: TestResultsService,
    private route: ActivatedRoute,
    public dialog: MatDialog) {
  }

  ngOnInit() {
    this.isLoading = true;
    this.route.paramMap
      .subscribe(params => {
        this.testRunId = this.route.snapshot.params['id'];
        this.testRunsService
          .getTestRun(this.testRunId, true)
          .subscribe(testRun => {
            if (testRun.testResults && testRun.testResults.length > 0) {
              this.testResults = testRun.testResults;
            }
            this.testRun = testRun;
            this.testModulesService
              .getTestReport(testRun.testSuiteId, testRun.createdAt)
              .subscribe(testModules => {
                testModules.forEach((testModule) => {
                  this.totalAutomated = testModule.testCases.reduce((total, testCase) => {
                    return (testCase.isAutomated) ? total += 1 : total;
                  }, this.totalAutomated)
                  this.totalTestCases += testModule.testCases.length;
                })
                this.testModules = testModules.map(testModule => ({
                  ...testModule,
                  sort: null,
                  reverse: false,
                  testResults: this.testResults.filter(testResult => {
                    return testResult.testModuleId === testModule.id;
                  }),
                  passes: this.testResults.filter(testResult => {
                    if (testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.Pass) {
                      const testCase = testModule.testCases.find(tc => tc.id === testResult.testCaseId);
                      testCase.testResult = testResult;
                      this.testCases.push(testCase);
                      this.totalPassCount += 1;
                      return testResult;
                    }
                  }),
                  failures: this.testResults.filter(testResult => {
                    if (testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.Fail) {
                      const testCase = testModule.testCases.find(tc => tc.id === testResult.testCaseId);
                      testCase.testResult = testResult;
                      this.testCases.push(testCase);
                      this.totalFailCount += 1;
                      return testResult;
                    }
                  }),
                  cnt: this.testResults.filter(testResult => {
                    if (testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.CNT) {
                      const testCase = testModule.testCases.find(tc => tc.id === testResult.testCaseId);
                      testCase.testResult = testResult;
                      this.testCases.push(testCase);
                      this.totalCntCount += 1;
                      return testResult;
                    }
                  }),
                  na: this.testResults.filter(testResult => {
                    if (testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.NA) {
                      this.totalNaCount += 1;
                      return testResult;
                    }
                  })
                }));
                this.totalPendingCount += (this.totalTestCases - (this.totalPassCount + this.totalFailCount + this.totalCntCount + this.totalNaCount))
                this.isLoading = false;
                this.populateCharts();
              })
          })

      })
  }

  public populateCharts() {
    const green = '#2BB673';
    const red = '#FE200B';
    const blue = '#4189C7'
    const gray = 'gray';

    this.resultsChart = new Chart('resultsChart', {
      type: 'doughnut',
      data: {
        labels: [
          `Pass (${this.totalPassCount})`,
          `Fail (${this.totalFailCount})`,
          `Could Not Test (${this.totalCntCount})`,
          `Did Not Test (${this.totalNaCount + this.totalPendingCount})`
        ],
        datasets: [{
          label: 'Results',
          data: [
            this.totalPassCount,
            this.totalFailCount,
            this.totalCntCount,
            this.totalNaCount + this.totalPendingCount
          ],
          backgroundColor: [
            green, red, blue, gray
          ]
        }]
      },
      options: {
        legend: {
          display: true,
          position: 'left'
        }
      }
    });

    this.totalsChart = new Chart('totalsChart', {
      type: 'doughnut',
      data: {
        labels: [
          `Automated (${this.totalAutomated})`,
          `Manual (${this.totalTestCases - this.totalAutomated})`
        ],
        datasets: [{
          data: [this.totalAutomated, this.totalTestCases - this.totalAutomated],
          backgroundColor: [
            green, blue, gray
          ]
        }]
      },
      options: {
        legend: {
          display: true,
          position: 'left'
        }
      }
    });


    const testModuleLabels = [];
    const passedTestData = [];
    const failedTestData = [];
    const cntTestData = [];
    const dntTestData = [];

    this.testModules.forEach(testModule => {
      testModuleLabels.push(testModule.name);
      passedTestData.push(testModule.passes.length);
      failedTestData.push(testModule.failures.length);
      cntTestData.push(testModule.cnt.length);
      dntTestData.push(testModule.testCases.length - testModule.passes.length - testModule.failures.length - testModule.cnt.length);

    });

    this.modulesChart = new Chart('modulesChart', {
      type: 'horizontalBar',
      data: {
        labels: testModuleLabels,
        datasets: [{
          label: 'Pass',
          data: passedTestData,
          backgroundColor: green
        },
        {
          label: 'Fail',
          data: failedTestData,
          backgroundColor: red
        },
        {
          label: 'CNT',
          data: cntTestData,
          backgroundColor: blue
        },
        {
          label: 'DNT',
          data: dntTestData,
          backgroundColor: gray
        }
        ]
      },
      options: {
        legend: {
          display: false,
          position: 'left'
        },
        scales: {
          xAxes: [{
            stacked: true
          }],
          yAxes: [{
            stacked: true,
            categoryPercentage: 1,
            maxBarThickness: 25,
            gridLines: {
              display: false
            },
            ticks: {
              fontSize: 14
            },
          }]
        }
      }
    });
  }

  getTestIssues() {
    if (!this.hasIssues) {
      this.testIssuesService.getTestIssues()
        .subscribe(testIssues => {
          testIssues.forEach((testIssue: TestIssue) => {
            const testCase = this.testCases.find(tc => tc.id === testIssue.testCaseId);
            if (testCase) {
              testCase.testIssues.push(testIssue);
            }
          })
          this.hasIssues = true;
        }, error => {
          this.handleErrorService.handleError(error);
        });
    }
  }
}
