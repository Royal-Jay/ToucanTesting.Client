import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { TestModulesService, TestRunsService, TestResultsService, TestCasesService, ExpectedResultsService, HandleErrorService } from '@services';
import { TestRun, TestModule, TestCase, TestResult } from '@models';
import { TestResultStatus, Priority } from '../../../enums';
import { ToastrService } from 'ngx-toastr';

@Component({
    styleUrls: ['./test-run.component.scss'],
    selector: 'test-run',
    templateUrl: './test-run.component.html'
})
export class TestRunComponent {
    isLoading: boolean = true;
    testRun: TestRun;
    testRunId: number;
    testResults: TestResult[] = [];
    failures: TestResult[];
    testModules: TestModule[];
    testResultStatus = TestResultStatus;
    priority = Priority;
    totalTestCases: number = 0;
    totalAutomated: number = 0;

    constructor(
        private toastr: ToastrService,
        private handleErrorService: HandleErrorService,
        private expectedResultsService: ExpectedResultsService,
        private testRunsService: TestRunsService,
        private testModulesService: TestModulesService,
        private testCasesService: TestCasesService,
        private testResultsService: TestResultsService,
        private route: ActivatedRoute,
        public dialog: MatDialog) {
    }

    ngOnInit() {
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
                            .getTestModules(testRun.testSuiteId, testRun.createdAt)
                            .subscribe(testModules => {
                                this.testModules = testModules.map(testModule => ({
                                    ...testModule,
                                    sort: null,
                                    reverse: false,
                                    testResults: this.testResults.filter(testResult => {
                                        return testResult.testModuleId === testModule.id;
                                    }),
                                    passes: this.testResults.filter(testResult => {
                                        return testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.Pass;
                                    }),
                                    failures: this.testResults.filter(testResult => {
                                        return testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.Fail;
                                    }),
                                    cnt: this.testResults.filter(testResult => {
                                        return testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.CNT;
                                    }),
                                    na: this.testResults.filter(testResult => {
                                        return testResult.testModuleId === testModule.id && testResult.status === this.testResultStatus.NA;
                                    })
                                }));
                                this.isLoading = false;
                            })
                    })

            })
    }

    public getTestResults(testModule: TestModule) {
        const index = this.testModules.indexOf(testModule);
        this.testCasesService
            .getTestCases(testModule, this.testRun.createdAt)
            .subscribe(testCases => {
                this.testModules[index].testCases = testCases;
                this.getTestModuleTestResults(testModule);
            }, error => {
                this.handleErrorService.handleError(error);
            });
    }

    public getTestModuleTestResults(testModule: TestModule) {
        this.testResults.forEach((testResult: TestResult) => {
            const testModuleIndex = this.testModules.indexOf(testModule);
            const testCaseIndex = this.testModules[testModuleIndex].testCases.findIndex(
                (c: TestCase) => c.id === testResult.testCaseId
            );
            if (testCaseIndex > -1) {
                this.testModules[testModuleIndex].testCases[testCaseIndex].testResult = testResult
            }
        })
    }

    public getExpectedResults(testModule: TestModule, testCase: TestCase) {
        if (testCase.expectedResults.length <= 0) {
            this.expectedResultsService.getTestResults(testModule, testCase)
                .subscribe(expectedResults => {
                    testCase.expectedResults = expectedResults;
                }, error => {
                    this.handleErrorService.handleError(error);
                });
        }
    }
}
