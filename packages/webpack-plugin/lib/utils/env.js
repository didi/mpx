function isReact (mode) {
    return mode === 'ios' || mode === 'android'
}

function isWeb (mode) {
    return mode === 'web'
}

function isTenon (mode) {
    return mode === 'tenon'
}

function isMiniProgram (mode) {
    return !isWeb(mode) && !isReact(mode) && !isTenon(mode)
}

module.exports = {
    isWeb,
    isReact,
    isTenon,
    isMiniProgram
}
