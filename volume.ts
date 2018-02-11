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
    selector: "volume-control",
    template: `
<div class="volume">
    <div #volumeMute class="mute" [class.not-muted]="!muted" [class.muted]="muted" (click)="clickMute()"></div>
    <div #volumeContainer class="volume-container">
        <div #volumeControl class="volume-control" [style.left]="calculateVolumeCurrent()"></div>
        <div #volumeCurrent class="volume-current" [style.width]="calculateVolumeCurrent()"></div>
        <div #volumeTotal class="volume-total"></div>
    </div>
</div>
    `
})
export class VolumeControl implements OnInit {
    @ViewChild("volumeMute")
    private volumeMute: ElementRef;

    @ViewChild("volumeControl")
    private volumeControl: ElementRef;

    @ViewChild("volumeCurrent")
    private volumeCurrent: ElementRef;

    @ViewChild("volumeTotal")
    private volumeTotal: ElementRef;

    @Input("volume")
    private volume: number;

    @Input("muted")
    private muted: Boolean;

    @Output()
    onVolumeChange = new EventEmitter();

    @Output()
    onMuteClick = new EventEmitter();

    private mousedrag;
    private mouseup = new EventEmitter();
    private mousedown = new EventEmitter();
    private mousemove = new EventEmitter();

    @HostListener("mousedown", ["$event"])
    onMouseDown = (evt: any) => {
        this.mousedown.next(evt);
    }

    @HostListener("mouseup", ["$event"])
    onMouseUp = (evt: any) => {
        this.mouseup.next(evt);
        this.onVolumeChange.emit(this.volume);
    }

    @HostListener("mousemove", ["$event"])
    onMousemove = (evt: any) => {
        this.mousemove.emit(evt);
    }

    constructor() {}

    ngOnInit() {
        // Find the center of the control
        let controlRect = this.volumeControl.nativeElement.getBoundingClientRect();
        let controlCenter = controlRect.right - ((controlRect.right - controlRect.left) / 2);

        // Determine the max of the volume control
        let volumeTotalLength = this.volumeTotal.nativeElement.getBoundingClientRect().width;

        // console.info("Timeline Container", this.timelineContainer, this.timelineContainer.nativeElement.getBoundingClientRect());
        // console.info("Timeline", this.timelineFull, this.timelineFull.nativeElement.getBoundingClientRect());
        // console.info("Playhead", this.playhead, playheadRect, this.playhead.nativeElement.offsetLeft, this.playhead.nativeElement.offsetLeft - this.playhead.nativeElement.offsetWidth);

        this.mousedown
            .switchMap(event => {
                return Rx.Observable.create((observer) => {
                    observer._next({
                        left: controlCenter
                    });
                });
            })
            .flatMap((imageOffset) => {
                return this.mousemove.flatMap((moveEvent) => {
                    return Rx.Observable.create((observer) => {
                        if (moveEvent["target"] !== this.volumeControl.nativeElement) {
                            observer._next({
                                left: (moveEvent["offsetX"] / volumeTotalLength) * 100
                            });
                        }
                    });
                }).takeUntil(this.mouseup);
            })
            .subscribe({
                next: pos => {
                    this.volumeControl.nativeElement.style.left = pos["left"] + "%";
                    this.volume = pos["left"];
                }
            });
    }

    clickMute = () => {
        this.onMuteClick.emit();
    }

    calculateVolumeCurrent = () => {
        return this.volume + "%";
    }
}

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        VolumeControl,
    ],
    exports: [
        VolumeControl,
    ],
})
export class VolumeControlModule {

}
