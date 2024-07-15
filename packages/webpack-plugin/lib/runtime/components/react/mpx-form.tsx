/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */

import { View, LayoutChangeEvent } from 'react-native';
import { JSX, useRef, forwardRef, ReactNode, Children, cloneElement } from 'react';
import useNodesRef, { HandlerRef } from './useNodesRef'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { FormContext } from './context'

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

const _Form = forwardRef<HandlerRef<View, FormProps>, FormProps>((props: FormProps, ref): JSX.Element => {
  const { children, style } = props;
  const layoutRef = useRef({})
  const formValuesMap = useRef(new Map()).current

  const { nodeRef: formRef } = useNodesRef(props, ref, {
    node: {}
  })

  const onLayout = (e: LayoutChangeEvent) => {
    formRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const travelChildren = (children: ReactNode): ReactNode => {
    const result = Children.toArray(children).map((child: any, index: number) => {
      const childTypeName = child.type && child.type.displayName
      if (!child.type) return child
      if (childTypeName === 'mpx-button' && ['submit', 'reset'].indexOf(child.props['form-type']) >= 0) {
        const bindtap = child.props.bindtap
        const catchtap = child.props.catchtap
        const formType = child.props['form-type']
        const triggerFormEvent = () => {
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
        }
        return cloneElement(child, {
          ...child.props,
          bindtap: () => {
            triggerFormEvent()
            bindtap && bindtap()
          },
          catchtap: () => {
            triggerFormEvent()
            catchtap && catchtap()
          }
        })
      }
      return cloneElement(child, { ...child.props }, travelChildren(child.props.children))
    })
    return result.length ? result : null
  }

  const submit = () => {
    const { bindsubmit } = props
    const formValue: Record<string, any> = {}
    for (let name of formValuesMap.keys()) {
      if (formValuesMap.get(name).getValue) {
        formValue[name] = formValuesMap.get(name).getValue()
      }
    }
    bindsubmit && bindsubmit(getCustomEvent(
      'submit',
      {},
      {
        detail: {
          value: formValue
        },
        layoutRef
      },
      props
    ))
  }

  const reset = () => {
    const { bindreset } = props
    bindreset && bindreset()
    formValuesMap.forEach(item => item.setValue({ type: 'reset' }))
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
      <FormContext.Provider value={{ formValuesMap }}>
        {travelChildren(children)}
      </FormContext.Provider>
    </View>
  );
})

_Form.displayName = 'mpx-form';

export default _Form