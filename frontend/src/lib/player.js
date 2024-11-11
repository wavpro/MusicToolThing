import { useState, useContext, useRef, useLayoutEffect } from 'react';
import { UserContext } from '../index.js';

import "../css/player.css";
import { createTrackAudioSource } from './handleRequests.js';
import useInterval from './useInterval.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

const Player = () => {
    const [linePercentage, setLinePercentage] = useState(0);
    const { playing, setPlaying } = useContext(UserContext);
    const wasPausedLastFrame = useRef(playing.paused);
    const lineInterval = useRef();

    const firstUpdate = useRef(true);
    useLayoutEffect(() => {
        if (firstUpdate.current) {
            track_id = playing.id;
            firstUpdate.current = false;
            return;
        }

        if (track_id !== playing.id) {
            document.querySelector('#player > audio').load();
            track_id = playing.id;
            setLinePercentage(0);
        }
    });

    useInterval(() => {
        if (playing.paused) return;

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
            <div id="line">
                <div id="linebg"></div>
                <div id="linebg2"></div>
                <div id="linefill" style={{
                    width: linePercentage + "vw"
                }}></div>
                <div id="lineball" style={{
                    marginLeft: linePercentage + "vw"
                }}></div>
            </div>
            <div id="play-button">
                <a onClick={
                    () => {
                        if (!playing.paused) {
                            document.querySelector('#player > audio').pause();
                        } else {
                            document.querySelector('#player > audio').play();
                        }

                        setPlaying({
                            ...playing,
                            paused: !playing.paused
                        });
                    }
                }>{playing.paused ? <FontAwesomeIcon icon="fa-solid fa-play" /> : <FontAwesomeIcon icon="fa-solid fa-pause" />}</a>
            </div>
            <div id="info">
                <img id="thumbnail" src={playing.thumbnailUrl} alt="Thumbnail" />
                <div id="tartist">
                    <p id="title">{playing.title}</p>
                    <p id="artist">{playing.artist}</p>
                </div>
                <p>{timestampToTime(playing.currentTime)}/{timestampToTime(playing.duration)}</p>
            </div>
        </div>
    )
}

export default Player;