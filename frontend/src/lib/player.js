import { useState, useContext, useEffect } from 'react';
import { UserContext } from '../index.js';

import PlayerHandler from './playerHandler.js';

import "../css/player.css";
let track_id = 0;
const playerHandler = new PlayerHandler();

function timestampToTime(timestamp) {
    const hours = Math.floor(timestamp / 3600000);
    const minutes = Math.floor((timestamp % 3600000) / 60000);
    const seconds = Math.floor((((timestamp % 3600000) / 60000) - minutes) * 60);
    if (hours) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const Player = () => {
    const [linePercentage, setLinePercentage] = useState(0);
    const { playing, setPlaying } = useContext(UserContext);

    useEffect(() => {
        async function s() {
            if (playing.id !== track_id) {
                track_id = playing.id;
                await playerHandler.switchTrack(playing.id);
                playing.paused = true;
                playing.currentTime = 0;
                setLinePercentage(0);
            }
        }
        s();
    });

    return (
        <div id="player">
            <div id="line" style={{
                width: linePercentage + "%"
            }}></div>
            <div id="play-button">
                <a onClick={
                    (e) => {
                        setPlaying({
                            ...playing,
                            paused: !playing.paused
                        });
                    }
                }>{ playing.paused ? ">" : "| |" }</a>
            </div>
            <div id="info">
                <img id="thumbnail" src={playing.thumbnailUrl} alt="Thumbnail"/>
                <div id="tartist">
                    <p id="title">{ playing.title }</p>
                    <p id="artist">{ playing.artist }</p>
                </div>
                <p>{ timestampToTime(playing.currentTime) }/{ timestampToTime(playing.duration) }</p>
            </div>
        </div>
    )
}

export default Player;