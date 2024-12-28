import React, { createContext } from 'react'

export type LocaleContextProps = {
  antLocale?: any
}
export interface LocaleProviderProps {
  children?: React.ReactNode,
  locale: any
}

export const LocaleContext = createContext<
  LocaleContextProps | undefined
>(undefined)

const LocaleProvider = (props :LocaleProviderProps): JSX.Element => {
  const locale = React.useMemo(() => {
    return { antLocale: { exist: true } }
  }, [])
  return (
    <LocaleContext.Provider value={locale}>
      {props.children}
    </LocaleContext.Provider>
  )
}

LocaleProvider.displayName = 'LocaleProvider'

export default React.memo(LocaleProvider)
