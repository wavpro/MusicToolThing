import { useState, useContext, useRef, useLayoutEffect } from 'react';
import { UserContext } from '../../index.js';

import "../../css/player.css";
import { createTrackAudioSource } from '../handleRequests.js';
import useInterval from '../useInterval.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Queue from './Queue.js';

// Make this a setting pls
const STEP_SIZE_MS = 10 * 1000;

let track_id = 0;

function timestampToTime(timestamp) {
    const hours = Math.floor(timestamp / 3600000);
    const minutes = Math.floor((timestamp % 3600000) / 60000);
    const seconds = Math.floor((((timestamp % 3600000) / 60000) - minutes) * 60);
    if (hours) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const AudioQualities = {
    Opus: 0,
    FLAC: 1,
    WAVE: 2,
    MPEG: 3,
    AAC: 4
}

function getContentType(quality) {
    switch (quality) {
        case AudioQualities.AAC:
            return 'audio/aac';
        case AudioQualities.FLAC:
            return 'audio/flac';
        case AudioQualities.MPEG:
            return 'audio/mpeg';
        case AudioQualities.Opus:
            return 'audio/ogg';
        case AudioQualities.WAVE:
            return 'audio/wav';
        default:
            return 'audio';
    }
}


// IMPORTANT:
// IMPLEMENT A JS SOLUTION FOR DRAGGING THE TIMELINE OF A TRACK


const Player = () => {
    const [linePercentage, setLinePercentage] = useState(0);
    const [showQueue, setShowQueue] = useState(false);
    const { queue, setQueue } = useContext(UserContext);

    const playing = queue.tracks[queue.position] ?? {
        id: -1,
        title: "No song playing",
        artist: "",
        currentTime: 0,
        duration: 0,
        thumbnails: {
            "64": "http://localhost:4000/tracks/0/cover?size=64",
            "128": "http://localhost:4000/tracks/0/cover?size=128",
            "512": "http://localhost:4000/tracks/0/cover?size=512",
            "1000": "http://localhost:4000/tracks/0/cover?size=1000"
        }
    };

    const setPlaying = (n) => {
        if (n.id === -1) {
            return;
        }

        let tracks = [...queue.tracks];
        tracks[queue.position] = n;

        setQueue({
            position: queue.position,
            tracks
        });
    }

    function startMediaSession() {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("play", () => {
                play();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                pause();
            });
            navigator.mediaSession.setActionHandler("stop", () => {
                window.close();
            });
            navigator.mediaSession.setActionHandler("seekbackward", (action, _, seekOffset) => {
                backwardOneStep();
            });
            navigator.mediaSession.setActionHandler("seekforward", (action, _, seekOffset) => {
                forwardOneStep();
            });
            navigator.mediaSession.setActionHandler("seekto", (action, fastSeek, __, seekTime) => {
                // Some browsers give seekto event without giving a seekTime mfw ಠ_ಠ
                if (seekTime) play(seekTime * 1000);
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                goPreviousTrack();
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                goNextTrack();
            });
        }
    }

    function setPositionState(at, playbackRate = 1) {
        console.log(at);
        at = at ?? 0;
        navigator.mediaSession.setPositionState({
            duration: playing.duration / 1000,
            playbackRate,
            position: at / 1000
        });
    }

    function isPlaying() {
        const audio = document.querySelector("#player > audio");
        if (!audio) {
            return false;
        }

        return !audio.paused;
    }
    function isEnded() {
        const audio = document.querySelector("#player > audio");
        if (!audio) {
            return false;
        }

        return audio.ended || audio.currentTime * 1000 === playing.duration;
    }
    function isNoTrackPlaying() {
        return playing.id === -1
    }
    function play(at) {
        const newPlaying = {
            ...playing
        }

        if (at && playing.currentTime !== at) {
            newPlaying.currentTime = at;
            document.querySelector('#player > audio').currentTime = at / 1000;
        }

        if (!isPlaying()) {
            document.querySelector('#player > audio').play();
        }

        setPlaying(newPlaying);
        setLinePercentage(((newPlaying.currentTime / newPlaying.duration) * 100).toFixed(2));
        setPositionState(at);
        startMediaSession();
    }

    function pause(at) {
        const newPlaying = {
            ...playing
        }

        if (at && playing.currentTime !== at) {
            newPlaying.currentTime = at;
            document.querySelector('#player > audio').currentTime = at / 1000;
        }

        if (isPlaying()) {
            document.querySelector("#player > audio").pause();
        }

        setPlaying(newPlaying);
        setLinePercentage(((newPlaying.currentTime / newPlaying.duration) * 100).toFixed(2));
        setPositionState(at);
        startMediaSession();
    }

    function forwardOneStep() {
        const audio = document.querySelector("#player > audio");

        const cTime = audio.currentTime * 1000;
        // I wouldn't have checked if it was within duration thx tabnine love ya bb
        const newCTime = Math.min(playing.duration, cTime + STEP_SIZE_MS);

        setPlaying({
            ...playing,
            currentTime: newCTime
        })

        audio.currentTime = newCTime / 1000;
        setPositionState(newCTime);
        startMediaSession();
    }
    function backwardOneStep() {
        const audio = document.querySelector("#player > audio");

        const cTime = audio.currentTime * 1000;
        // I wouldn't have checked if it was within duration thx tabnine love ya bb
        const newCTime = Math.max(0, cTime - STEP_SIZE_MS);

        setPlaying({
            ...playing,
            currentTime: newCTime
        })

        audio.currentTime = newCTime / 1000;
        setPositionState(newCTime);
        startMediaSession();
    }

    function goPreviousTrack() {
        const newPosition = queue.position - 1;
        if (newPosition < 0) {
            return;
        }

        setQueue({
            position: newPosition,
            tracks: [...queue.tracks]
        });
    }

    function goNextTrack() {
        const newPosition = queue.position + 1;
        if (newPosition >= queue.tracks.length) {
            return;
        }

        setQueue({
            position: newPosition,
            tracks: [...queue.tracks]
        });
    }

    const firstUpdate = useRef(true);
    useLayoutEffect(() => {
        if (firstUpdate.current) {
            track_id = playing.id;

            firstUpdate.current = false;
            return;
        }

        if (track_id !== playing.id) {
            if ("mediaSession" in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: playing.title,
                    artist: playing.artist,
                    album: "NOT YET IMPLEMENTED",
                    artwork: [
                        {
                            src: playing.thumbnails["64"],
                            sizes: "64x64",
                            type: "image/png",
                        },
                        {
                            src: playing.thumbnails["128"],
                            sizes: "128x128",
                            type: "image/png",
                        },
                        {
                            src: playing.thumbnails["512"],
                            sizes: "512x512",
                            type: "image/png",
                        },
                        {
                            src: playing.thumbnails["1000"],
                            sizes: "1000x1000",
                            type: "image/png",
                        }
                    ],
                });
            }
            document.querySelector('#player > audio').load();
            track_id = playing.id;
            setLinePercentage(0);
        }
    }, [setLinePercentage, playing.artist, playing.id, playing.thumbnails, playing.title]);

    useInterval(() => {
        if (!isPlaying()) return;

        setPositionState(playing.currentTime);

        setLinePercentage(((playing.currentTime / playing.duration) * 100).toFixed(2));
    }, 1000)

    return (
        <div id="player">
            <audio onTimeUpdate={(e) => {
                setPlaying({
                    ...playing,
                    currentTime: Math.floor(e.currentTarget.currentTime * 1000)
                })
            }}>
                <source src={createTrackAudioSource(playing.id, 1)} type={getContentType(1)}></source>
            </audio>
            <div id="line" className={isNoTrackPlaying() ? "no-interact" : ""} onMouseDown={(e) => {
                const wasPlaying = isPlaying();
                const wasEnded = isEnded();
                if (wasPlaying) {
                    pause();
                }

                const line = e.currentTarget;
                line.classList.add("active");

                const moveListener = (e) => {
                    const newCTime = Math.floor((e.clientX / window.innerWidth) * playing.duration);
                    setLinePercentage((e.clientX / window.innerWidth) * 100);

                    pause(newCTime);
                }
                const upListener = (e) => {
                    const newCTime = Math.floor((e.clientX / window.innerWidth) * playing.duration);

                    document.removeEventListener("mousemove", moveListener);
                    document.removeEventListener("mouseup", upListener);

                    line.classList.remove("active");

                    if (wasPlaying || wasEnded) {
                        play(newCTime);
                    } else {
                        pause(newCTime);
                    }
                }

                document.addEventListener("mousemove", moveListener);
                document.addEventListener("mouseup", upListener);
            }}>
                <div id="linebg"></div>
                <div id="linebg2"></div>
                <div id="linefill" style={{
                    width: linePercentage + "vw"
                }}></div>
                <div id="lineball" style={{
                    marginLeft: linePercentage + "vw"
                }}></div>
            </div>
            <div id="controls">
                <button id="backstep" onClick={() => {
                    goPreviousTrack();
                }} className={`${queue.position === 0 ? "disabled" : "clickable"}`}>
                    <FontAwesomeIcon icon="fa-solid fa-backward-step" />
                </button>
                <div id="play-button" className={isNoTrackPlaying() ? "disabled" : "clickable"}>
                    <button onClick={
                        () => {
                            if (isPlaying()) {
                                pause();
                            } else {
                                play();
                            }
                        }
                    }>{isPlaying() ? <FontAwesomeIcon icon="fa-solid fa-pause" /> : <FontAwesomeIcon icon="fa-solid fa-play" />}</button>
                </div>
                <button id="forwardstep" onClick={() => {
                    goNextTrack();
                }} className={`${(queue.position === (queue.tracks.length - 1)) || isNoTrackPlaying() ? "disabled" : "clickable"}`}>
                    <FontAwesomeIcon icon="fa-solid fa-forward-step" />
                </button>
            </div>
            <div id="info">
                <img id="thumbnail" src={playing.thumbnails["64"]} alt="Thumbnail" />
                <div id="tartist">
                    <p id="title">{playing.title}</p>
                    <p id="artist">{playing.artist}</p>
                </div>
                <p hidden={isNoTrackPlaying()}>{timestampToTime(playing.currentTime)}/{timestampToTime(playing.duration)}</p>
            </div>
            <div id="right-items">
                <button onClick={() => {
                    setShowQueue(!showQueue);
                }}>
                    <div id="queue-button-hidden" hidden={showQueue}>
                        <FontAwesomeIcon icon="fa-solid fa-bars" />
                    </div>
                    <div id="queue-button-show" hidden={!showQueue}>
                        <FontAwesomeIcon icon="fa-solid fa-bars-staggered" />
                    </div>
                </button>
            </div>

            <div id="queue-container" hidden={!showQueue}>
                <Queue />
            </div>
        </div>
    )
}

export default Player;