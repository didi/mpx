import React, { useRef } from 'react'
import { render } from '@testing-library/react-native'
import { View } from 'react-native'
import useNodesRef from '../../../lib/runtime/components/react/useNodesRef'

interface NodeHandler {
  getNodeInstance(): any
}

interface NodeProps {
  id: string
}

const NodeProbe = React.forwardRef<NodeHandler, NodeProps>(function NodeProbe (props, ref) {
  const nodeRef = useRef<View>(null)
  useNodesRef(props, ref, nodeRef)
  return <View ref={nodeRef} />
})

NodeProbe.displayName = 'NodeProbe'

describe('useNodesRef', () => {
  it('uses an empty instance by default and exposes current props', () => {
    const ref = React.createRef<NodeHandler>()
    const { rerender } = render(<NodeProbe ref={ref} id="node" />)

    const nodeInstance = ref.current?.getNodeInstance()
    expect(nodeInstance.instance).toEqual({})
    expect(nodeInstance.props.current).toEqual({ id: 'node' })

    rerender(<NodeProbe ref={ref} id="updated-node" />)
    expect(nodeInstance.props.current).toEqual({ id: 'updated-node' })
  })
})
