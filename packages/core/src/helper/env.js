export function getEnvObj () {
  switch (__mpx_mode__) {
    case 'wx':
      return wx
    case 'ali':
      return my
    case 'swan':
      return swan
    case 'qq':
      return qq
    case 'tt':
      return tt
    case 'jd':
      return jd
    case 'qa':
      return qa
    case 'dd':
      return dd
    case 'ks':
      return ks
  }
}
