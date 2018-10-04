import React from 'react';

import {
    Video,
    GridLayout
} from '@andyet/simplewebrtc';

const MyScreen = (props) => {

    const video = props.items.map((item) => {
        return (
            <div>
                <Video media={item}></Video>
            </div>
        );
    })

    return (
        <div>{video}</div>
    )
}

export default MyScreen;