import { useContext } from 'react';
import { UserContext } from '../../index.js';
import { createTrackAudioCover, getTrackInfo } from "../../lib/handleRequests";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import "../../css/list-of-tracks.css";

export default function ListOfTracks({ tracks }) {
    const { queue, setQueue } = useContext(UserContext);
    return <ul className="tracklist">
        {tracks.map((track, index) => (
            <li key={index} className="track">
                <img src={createTrackAudioCover(track.id, 64)} alt={track.title} />
                <h3>{track.title}</h3>
                <button onClick={async () => {
                    const info = await getTrackInfo(track.id);

                    setQueue({
                        position: queue.position,
                        tracks: [...queue.tracks, {
                            id: info.id,
                            title: info.title,
                            artist: info.artist,
                            currentTime: 0,
                            duration: info.duration,
                            thumbnails: {
                                "64": createTrackAudioCover(2, 64),
                                "128": createTrackAudioCover(2, 128),
                                "512": createTrackAudioCover(2, 512),
                                "1000": createTrackAudioCover(2, 1000),
                            }
                        }]
                    });
                }}><FontAwesomeIcon icon="fa-regular fa-square-plus" /></button>
            </li>
        ))}
    </ul>
}