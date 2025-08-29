import { createContext, useContext } from 'react';
export const PickerViewColumnAnimationContext = createContext(undefined);
export const usePickerViewColumnAnimationContext = () => {
    const value = useContext(PickerViewColumnAnimationContext);
    if (value === undefined) {
        throw new Error('usePickerViewColumnAnimationContext must be called from within PickerViewColumnAnimationContext.Provider!');
    }
    return value;
};
export const PickerViewStyleContext = createContext(undefined);
export const usePickerViewStyleContext = () => {
    const value = useContext(PickerViewStyleContext);
    return value;
};
