function isReact (mode) {
    return mode === 'ios' || mode === 'android' || mode === 'harmony'
}

function isWeb (mode) {
    return mode === 'web'
}

function isMiniProgram (mode) {
    return !isWeb(mode) && !isReact(mode)
}

module.exports = {
    isWeb,
    isReact,
    isMiniProgram
}
