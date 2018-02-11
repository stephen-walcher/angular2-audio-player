///<reference path="../../typings/howler.d.ts" />
///<reference path="../../typings/globals/jquery/index.d.ts" />

import { Component, ViewChild, ElementRef } from "@angular/core";
import { Router } from "@angular/router";

import { PlayerService } from "./service";
import { AuthService } from "../auth/service";

import { PlayerTimelineModule } from "./timeline";

import { EnvironmentConfig } from "../config/environment";

import { Observable } from "rxjs/Observable";

import { Howl } from "howler";

@Component({
    selector: "player",
    templateUrl: "templates/player.template.html"
})

export class PlayerComponent {
    @ViewChild("musicPlayer")
    private el_player: ElementRef;

    song_loaded: boolean = false;

    song_info: Object = {};

    playing: boolean = false;
    seeking: boolean = false;

    muted: boolean = false;

    volume: number = 40;

    currently_playing: Object = {
        title : "",
        artist : "",
        current_time : 0,
        total_time: 0
    };

    sound: Howl;
    sound_id: Number;

    playhead_update: any;

    display_message: number = 0;

    constructor(
        private playerService: PlayerService,
        private authService: AuthService
    ) {
        playerService.release$.subscribe(
            release => {
                if (this.playing) {
                    this.playerStop();
                }

                this.loadReleaseInfo(release);
                this.playFile("release", release);
            }
        );

        playerService.version$.subscribe(
            version => {
                if (this.playing) {
                    this.playerStop();
                }

                this.loadVersionInfo(version);
                this.playFile("version", version);
            }
        );

        Observable.timer(50, 250)
            .subscribe(
                (interval) => {
                    if (this.playing && !this.seeking) {
                        this.currently_playing["current_time"] = this.sound.seek();
                    }
                }
            );
    }

    loadReleaseInfo = (release: Number) => {
        this.playerService.loadReleaseInfo(release)
            .then((info) => {
                this.song_loaded = true;

                this.song_info = info;
            });
    }

    loadVersionInfo = (version: Number) => {
        this.playerService.loadVersionInfo(version)
            .then((info) => {
                this.song_loaded = true;

                this.song_info = info;
            });
    }

    playFile = (type: String, id: Number) => {
        let context = this;
        let url = "";

        this.currently_playing["title"] = "Loading music...";
        this.currently_playing["artist"] = "Please wait";
        this.currently_playing["current_time"] = 0;
        this.currently_playing["total_time"] = 10;

        if (this.authService.isLoggedIn) {
            url = EnvironmentConfig.crateurl + "/" + type + "/play/" + id;

        } else {
            let newId = 100000000 - (id.valueOf() * (new Date().getDay() + 1));
            url = EnvironmentConfig.crateurl + "/" + type + "/play/" + newId;
        }

        this.sound = new Howl({
            src: [url],
            html5: true,
            autoplay: false,
            mute: context.muted,
            volume: this.volume / 100
        });

        setTimeout(() => {
            this.updatePlayerInfo();

            if (!window["iOS"]) {
                this.playerStart();
            }
        }, 2000);
    }

    playerStart = () => {
        this.sound.play();
        this.playing = true;
    }

    playerPause = () => {
        this.sound.pause();
        this.playing = false;
    }

    playerStop = () => {
        this.sound.stop();
        this.playing = false;
    }

    clickPlayPause = () => {
        this.display_message++;

        if (this.playing) {
            this.playerPause();

        } else {
            this.playerStart();
        }
    }

    changeVolume = (value: number) => {
        this.volume = value;
        this.sound.volume(value / 100);
    }

    clickMute = () => {
        this.muted = !this.muted;

        this.sound.volume(this.muted ? 0 : this.volume);
    }

    clickClose = () => {
        this.playerStop();

        this.sound.unload();

        this.song_loaded = false;
    }

    getPlayheadPosition = (): string => {
        return ((this.currently_playing["current_time"] / this.currently_playing["total_time"]) * 100) - 1.5 + "%";
    }

    getTimelineFill = (): string => {
        return (this.currently_playing["current_time"] / this.currently_playing["total_time"]) * 100 + "%";
    }

    seekingTrack = () => {
        this.seeking = true;
    }

    seekTrack = (percent: number) => {
        let seekTo = this.currently_playing["total_time"] * (percent / 100);

        this.seeking = false;
        this.sound.seek(seekTo);
    }

    private updatePlayhead = (context) => {
        context.currently_playing["current_time"]++;
    }

    private updatePlayerInfo = () => {
        this.currently_playing["title"] = this.song_info["title"] + " - " + this.song_info["type"];
        this.currently_playing["artist"] = this.song_info["artist"];
        this.currently_playing["current_time"] = 0;
        this.currently_playing["total_time"] = this.song_info["time"];
    }
}
