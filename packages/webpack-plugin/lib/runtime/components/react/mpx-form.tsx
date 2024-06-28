/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */

import { View, LayoutChangeEvent } from 'react-native';
import React, { JSX, useRef, cloneElement, forwardRef, ReactNode } from 'react';
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
    'mpx-radio-group'
  ].includes(typeName)
}


const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((props: FormProps, ref): JSX.Element => {
  const { children, style } = props;
  const layoutRef = useRef(null)
  const formValues = useRef('')

  const { nodeRef: formRef } = useNodesRef(props, ref, {
    node: {}
  })

  const onLayout = (e: LayoutChangeEvent) => {
    formRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const getFormValue = (child) => {
    const childTypeName = child.type && child.type.displayName
    const childPropsName = child.props.name
    const valueChangeCbName = childTypeName === 'mpx-input' || childTypeName === 'mpx-textarea' ? 'bindblur' : 'bindchange'
    const tmpProps = { ...child.props }
    if (['mpx-input', 'mpx-textarea', 'mpx-slider', 'mpx-picker'].includes(childTypeName)) {
      if (child.props.value !== undefined) {
        formValues.current[childPropsName] = child.props.value
      }
    } else if (childTypeName === 'mpx-switch') {
      if (child.props.checked !== undefined) {
        formValues.current.formValues[childPropsName] = !!child.props.checked
      }
    } else {
      tmpProps.setGroupData = (value: any) => {
        formValues.current.formValues[childPropsName] = value
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    tmpProps[valueChangeCbName] = (event: any) => {
      const valueChangeCb = child.props[valueChangeCbName]
      formValues.current[childPropsName] = event.detail.value
      // eslint-disable-next-line prefer-rest-params
      valueChangeCb && valueChangeCb(...arguments)
    }
    return cloneElement(child, tmpProps, child.props.children)
  }

  const travelChildren = (children: React.ReactNode): React.ReactNode => {
    const result = React.Children.toArray(children).map((child: any) => {
      const childTypeName = child.type && child.type.displayName
      if (!child.type) return child
      if (childTypeName === 'mpx-button' && ['submit', 'reset'].indexOf(child.props['form-type']) >= 0) {
        const bindtap = child.props.bindtap
        const formType = child.props['form-type']
        return React.cloneElement(child, {
          ...child.props,
          bindtap: () => {
            switch (formType) {
              case 'submit':
                submit()
                break;
              case 'reset':
                reset()
                break;
              default:
                break;
            }
            bindtap && bindtap()
          }
        })
      }
      return isFormTypeElement(childTypeName) && child.props.name
        ? getFormValue(child)
        : React.cloneElement(child, { ...child.props }, travelChildren(child.props.children))
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