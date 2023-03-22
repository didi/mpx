const mpEscapeMap = {
  '(': '_pl_',
  ')': '_pr_',
  '[': '_bl_',
  ']': '_br_',
  '#': '_h_',
  '!': '_i_',
  '/': '_s_',
  '.': '_d_',
  ':': '_c_',
  '2c': '_2c_',
  '%': '_p_',
  '\'': '_q_',
  '"': '_dq_',
  '+': '_a_'

}

const escapeReg = /\\(2c|.)/g

function mpEscape (str) {
  return str.replace(escapeReg, (_, p1) => {
    if (mpEscapeMap[p1]) return mpEscapeMap[p1]
    // unknown escape
    return '_u_'
  })
}
