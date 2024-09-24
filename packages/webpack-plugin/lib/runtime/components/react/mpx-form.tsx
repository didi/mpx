/**
 * ✘ report-submit
 * ✘ report-submit-timeout
 * ✔ bindsubmit
 * ✔ bindreset
 */

import { View, LayoutChangeEvent } from 'react-native';
import { JSX, useRef, forwardRef, ReactNode } from 'react';
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

  const { nodeRef: formRef } = useNodesRef(props, ref)

  const onLayout = (e: LayoutChangeEvent) => {
    formRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
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
    formValuesMap.forEach(item => item.resetValue())
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
      <FormContext.Provider value={{ formValuesMap, submit, reset }}>
        {children}
      </FormContext.Provider>
    </View>
  );
})

_Form.displayName = 'mpx-form';

export default _Form