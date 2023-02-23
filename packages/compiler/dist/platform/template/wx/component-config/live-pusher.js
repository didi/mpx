"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'live-pusher';
function default_1({ print }) {
    const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false });
    const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' });
    return {
        test: TAG_NAME,
        props: [
            {
                test: /^(remote-mirror|local-mirror|audio-reverb-type|enable-mic|enable-agc|enable-ans|audio-volume-type|video-width|video-height|beauty-style|filter)$/,
                qq: qqPropLog
            }
        ],
        event: [
            {
                test: /^(audiovolumenotify)$/,
                qq: qqEventLog
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=live-pusher.js.map