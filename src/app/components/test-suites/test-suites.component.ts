import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TestSuitesService, HandleErrorService, AuthService } from '@services';
import { CreateTestSuiteDialogComponent } from '../shared/dialogs/create/test-suite/create-test-suite-dialog.component';
import { DeleteDialogComponent } from './../shared/dialogs/delete/delete-dialog.component';
import { DialogType } from './../../enums';
import { TestSuite } from '@models';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'test-suites',
    templateUrl: './test-suites.component.html'
})
export class TestSuitesComponent {
    isLoading: boolean = true;
    testSuites: TestSuite[];
    hoverIndex: number | null;
    tempName: string;

    constructor(
        public auth: AuthService,
        private toastr: ToastrService,
        private handleErrorService: HandleErrorService,
        private fb: FormBuilder,
        private testSuitesService: TestSuitesService,
        public dialog: MatDialog
    ) {
        auth.handleAuthentication();
    }

    ngOnInit() {
        this.testSuitesService
            .getTestSuites()
            .subscribe(testSuites => {
                this.testSuites = testSuites;
                this.isLoading = false;
            }, error => {
                this.handleErrorService.handleError(error);
            });
    }

    openDeleteDialog(testSuite: TestSuite): void {
        const dialogRef = this.dialog.open(DeleteDialogComponent, { data: { title: testSuite.name } });

        dialogRef.afterClosed().subscribe(res => {
            res ? this.deleteTestSuite(testSuite) : false;
        });
    }

    deleteTestSuite(testSuite: TestSuite) {
        this.testSuitesService
            .deleteTestSuite(testSuite.id)
            .subscribe(res => {
                const index = this.testSuites.indexOf(testSuite, 0);
                if (index > -1) {
                    this.testSuites.splice(index, 1);
                }
                this.toastr.success(testSuite.name, 'DELETED');
            }, error => {
                this.handleErrorService.handleError(error);
            });
    }

    cancelEdit(testSuite: TestSuite) {
        testSuite.name = this.tempName;
    }

    renameTestSuite(testSuite: TestSuite) {
        this.testSuitesService
            .updateTestSuite(testSuite)
            .subscribe(res => {
                this.toastr.success(testSuite.name, 'UPDATED');
            }, error => {
                this.handleErrorService.handleError(error);
            });
    }

    openUpsertDialog(testSuite?: TestSuite): void {
        const dialogRef = this.dialog.open(CreateTestSuiteDialogComponent, {
            data: {
                title: 'Create a New Test Suite',
                type: DialogType.TestSuite,
                testSuite: testSuite
            }
        });

        dialogRef.afterClosed().subscribe(res => {
            if (testSuite && res) {
                testSuite.name = res.name;
                this.renameTestSuite(testSuite);
            } else if (!testSuite && res) {
                this.createTestSuite(res)
            }
        });
    }

    createTestSuite(testSuite: TestSuite) {
        this.testSuitesService.createTestSuites(testSuite)
            .subscribe(res => {
                this.testSuites.push(res);
                this.toastr.success(res.name, 'CREATED');
            }, error => {
                this.handleErrorService.handleError(error);
            });
    }
}
