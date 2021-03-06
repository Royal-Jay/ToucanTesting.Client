import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { TestSuite } from '@models';

@Injectable()
export class TestSuitesService {
    constructor(private http: HttpClient) {

    }

    public createTestSuites(testSuite: TestSuite): Observable<TestSuite> {
        return this.http.post<TestSuite>(`test-suites`, testSuite);
    }

    public getTestSuites(): Observable<TestSuite[]> {
        return this.http.get<TestSuite[]>(`test-suites`);
    }

    public getTestSuite(id: number): Observable<TestSuite> {
        return this.http.get<TestSuite>(`test-suites/${id}`);
    }

    public updateTestSuite(testSuite: TestSuite): Observable<TestSuite> {
        return this.http.put<TestSuite>(`test-suites/${testSuite.id}`, testSuite)
    }

    public deleteTestSuite(id: number) {
        return this.http.delete(`test-suites/${id}`);
    }
}
