import {
    Component,
    NgModule,
    Input,
    Output,
    ViewChild,
    HostListener,
    ElementRef,
    EventEmitter,
    OnInit
} from "@angular/core";

import { CommonModule } from "@angular/common";

import Rx from "rxjs/Rx";

@Component({
    selector: "timeline",
    template: `
<div #timelineContainer class="track-container">
    <div #playhead class="playhead" [style.left]="playheadPosition"></div>
    <div #timelinePlayed class="track-played" [style.width]="timelineFill"></div>
    <div #timelineFull class="track-full"></div>
</div>
    `
})
export class PlayerTimeline implements OnInit {
    @ViewChild("playhead")
    private playhead: ElementRef;

    @ViewChild("timelinePlayed")
    private timelinePlayed: ElementRef;

    @ViewChild("timelineFull")
    private timelineFull: ElementRef;

    @ViewChild("timelineContainer")
    private timelineContainer: ElementRef;

    @Input("playheadPosition")
    private playheadPosition: string;

    @Input("timelineFill")
    private timelineFill: string;

    @Output()
    onSeeking = new EventEmitter();

    @Output()
    onSeek = new EventEmitter();

    private mousedrag;
    private mouseup = new EventEmitter();
    private mousedown = new EventEmitter();
    private mousemove = new EventEmitter();

    private position: number = 0;

    @HostListener("mousedown", ["$event"])
    onMouseDown = (evt: any) => {
        this.mousedown.next(evt);
        this.onSeeking.emit();
    }

    @HostListener("mouseup", ["$event"])
    onMouseUp = (evt: any) => {
        this.mouseup.next(evt);
        this.onSeek.emit(this.position);
    }

    @HostListener("mousemove", ["$event"])
    onMousemove = (evt: any) => {
        this.mousemove.emit(evt);
    }

    constructor() {}

    ngOnInit() {
        // Find the center of the playhead
        let playheadRect = this.playhead.nativeElement.getBoundingClientRect();
        let playheadCenter = playheadRect.right - ((playheadRect.right - playheadRect.left) / 2);

        // Determine the bounds of the timeline
        let timelineStart = this.timelineFull.nativeElement.getBoundingClientRect().left;
        let timelineEnd = this.timelineFull.nativeElement.getBoundingClientRect().right;
        let timelineWidth = this.timelineContainer.nativeElement.getBoundingClientRect().width;

        // console.info("Timeline Container", this.timelineContainer, this.timelineContainer.nativeElement.getBoundingClientRect());
        // console.info("Timeline", this.timelineFull, this.timelineFull.nativeElement.getBoundingClientRect());
        // console.info("Playhead", this.playhead, playheadRect, this.playhead.nativeElement.offsetLeft, this.playhead.nativeElement.offsetLeft - this.playhead.nativeElement.offsetWidth);

        this.mousedown
            .switchMap(event => {
                return Rx.Observable.create((observer) => {
                    observer._next({
                        left: playheadCenter
                    });
                });
            })
            .flatMap((imageOffset) => {
                return this.mousemove.flatMap((moveEvent) => {
                    return Rx.Observable.create((observer) => {
                        if (moveEvent["target"] !== this.playhead.nativeElement) {
                            observer._next({
                                left: (moveEvent["offsetX"] / timelineWidth) * 100
                            });
                        }
                    });
                }).takeUntil(this.mouseup);
            })
            .subscribe({
                next: pos => {
                    this.playhead.nativeElement.style.left = pos["left"] + "%";
                    this.position = pos["left"];
                }
            });
    }
}

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        PlayerTimeline,
    ],
    exports: [
        PlayerTimeline,
    ],
})
export class PlayerTimelineModule {

}
