/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */

import { View, LayoutChangeEvent } from 'react-native';
import React, { JSX, useRef, forwardRef, ReactNode, Children } from 'react';
import useNodesRef, { HandlerRef } from '../../useNodesRef'
import useInnerProps, { getCustomEvent } from './getInnerListeners'

interface FormProps {
  style?: Record<string, any>;
  children: ReactNode;
  bindsubmit?: (evt: {
    detail: {
      value: any;
    };
  }) => void;
  bindreset?: () => void;
}

const isFormTypeElement = (typeName: string): boolean => {
  return [
    'mpx-input',
    'mpx-textarea',
    'mpx-switch',
    'mpx-slider',
    'mpx-picker',
    'mpx-checkbox-group',
    'mpx-radio-group',
    'mpx-checkbox',
    'mpx-radio'
  ].includes(typeName)
}


const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((props: FormProps, ref): JSX.Element => {
  const { children, style } = props;
  const layoutRef = useRef(null)
  const formValues = useRef({})

  const { nodeRef: formRef } = useNodesRef(props, ref, {
    node: {}
  })

  const onLayout = (e: LayoutChangeEvent) => {
    formRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const getFormValue = (child) => {
    const childDisplayName = child.type && child.type.displayName
    const childPropsName = child.props.name
    const proxyChangeEvent = childDisplayName === 'mpx-input' || childDisplayName === 'mpx-textarea' ? 'bindinput' : 'bindchange'
    const childProps = { ...child.props }
    if (['mpx-input', 'mpx-textarea', 'mpx-slider', 'mpx-picker'].includes(childDisplayName)) {
      if (child.props.value !== undefined) {
        formValues.current[childPropsName] = child.props.value
      }
    } else if (childDisplayName === 'mpx-switch') {
      if (child.props.checked !== undefined) {
        formValues.current[childPropsName] = !!child.props.checked
      }
    } else {
      childProps._setGroupData = (value: any) => {
        formValues.current[childPropsName] = value
      }
    }
    childProps[proxyChangeEvent] = (event: any) => {
      const changeEvent = child.props[proxyChangeEvent]
      formValues.current[childPropsName] = event.detail.value
      changeEvent && changeEvent(event)
    }
    return <child.type
      key={`${child.type}-${child.props.name}`}
      {...childProps}
    />
  }

  const travelChildren = (children: React.ReactNode): React.ReactNode => {
    const result = Children.toArray(children).map((child: any, index: number) => {
      const childTypeName = child.type && child.type.displayName
      if (!child.type) return child
      if (childTypeName === 'mpx-button' && ['submit', 'reset'].indexOf(child.props['form-type']) >= 0) {
        const bindtap = child.props.bindtap
        const formType = child.props['form-type']
        return <child.type
          key={`button-${formType}-${index}`}
          {...child.props}
          bindtap={() => {
            switch (formType) {
              case 'submit':
                submit();
                break;
              case 'reset':
                reset();
                break;
              default:
                break;
            }
            bindtap && bindtap()
          }}
        />
      }
      return isFormTypeElement(childTypeName) && child.props.name
        ? getFormValue(child)
        : <child.type
          key={`child-${index}`}
          {...child.props}
        >{travelChildren(child.props.children)}</child.type>
    })
    return result.length ? result : null
  }

  const submit = () => {
    const { bindsubmit } = props
    bindsubmit && bindsubmit(getCustomEvent(
      'submit',
      {},
      {
        detail: {
          value: formValues.current
        },
        layoutRef
      },
      props
    ))
  }

  const reset = () => {
    const { bindreset } = props
    formRef.current = {}
    bindreset && bindreset()
  }
  const innerProps = useInnerProps(props, {
    ref: formRef,
    style,
    onLayout
  }, [
    'children',
    'style',
    'bindsubmit',
    'bindreset'
  ], { layoutRef });

  return (
    <View
      {...innerProps}
    >
      {travelChildren(children)}
    </View>
  );
})

_Form.displayName = 'mpx-form';

export default _Form