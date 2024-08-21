
 import { ViewProps } from 'react-native'
 
 const _Block: React.FC<ViewProps> = (props): JSX.Element => {
     return (
      <>
        {props.children}
      </>
     )
 }
 
 _Block.displayName = 'mpx-block'
 
 export default _Block
 