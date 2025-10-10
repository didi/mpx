function isReact (mode) {
    return mode === 'ios' || mode === 'android' || mode === 'harmony'
}

function isWeb (mode) {
    return mode === 'web'
}

function isMiniProgram (mode) {
    return !isWeb(mode) && !isReact(mode)
}

function isNoMode (mode) {
    return mode === 'noMode'
}

module.exports = {
    isWeb,
    isReact,
    isMiniProgram,
    isNoMode
}
