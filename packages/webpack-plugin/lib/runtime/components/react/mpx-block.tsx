
 import { ViewProps } from 'react-native'
 import React, { JSX } from 'react'

 const _Block: React.FC<ViewProps> = (props): JSX.Element => {
     return (
      <>
        {props.children}
      </>
     )
 }
 
 _Block.displayName = 'mpx-block'
 
 export default _Block
 