import { Injectable } from "@angular/core";
import { Response } from "@angular/http";
// import { Http, Response } from "@angular/http";

import { HTTPInterceptor } from "../interceptor.service";

import { EnvironmentConfig } from "../config/environment";

import { Subject } from "rxjs/Subject";

import "rxjs/add/operator/toPromise";

@Injectable()
export class PlayerService {

    private releaseSource = new Subject<Number>();
    private versionSource = new Subject<Number>();

    release$ = this.releaseSource.asObservable();
    version$ = this.versionSource.asObservable();

    constructor(
        // private http: Http,
        private newHttp: HTTPInterceptor
    ) {}

    requestVersion(version: Number) {
        this.versionSource.next(version);
    }

    requestRelease(release: Number) {
        this.releaseSource.next(release);
    }

    private handleError(error: any) {
        console.error("An error occurred", error);
        return Promise.reject(error.message || error);
    }

    private extractJSON(res: Response) {
        let json = res.json();
        return json._body || "";
    }

    public loadReleaseInfo(release) {
        return this.newHttp.get(EnvironmentConfig.crateurl + "/release/info/" + release)
                   .toPromise()
                   .then(response => response.json())
                   .catch(this.handleError);
    }

    public loadVersionInfo(version) {
        return this.newHttp.get(EnvironmentConfig.crateurl + "/version/info/" + version)
                   .toPromise()
                   .then(response => response.json())
                   .catch(this.handleError);
    }
}
