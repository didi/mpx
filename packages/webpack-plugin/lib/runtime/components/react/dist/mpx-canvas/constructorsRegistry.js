import { Image } from './Image';
import CanvasGradient from './CanvasGradient';
import ImageData from './ImageData';
export var ConstructorType;
(function (ConstructorType) {
    ConstructorType["Image"] = "Image";
    ConstructorType["CanvasGradient"] = "CanvasGradient";
    ConstructorType["ImageData"] = "ImageData";
})(ConstructorType || (ConstructorType = {}));
const constructors = [
    { type: ConstructorType.Image, instance: Image },
    { type: ConstructorType.CanvasGradient, instance: CanvasGradient },
    { type: ConstructorType.ImageData, instance: ImageData }
];
export function useConstructorsRegistry() {
    const register = (registerWebviewConstructor) => {
        constructors.forEach(({ type, instance }) => {
            registerWebviewConstructor(instance, type);
        });
    };
    const getConstructor = (type) => {
        return constructors.find(c => c.type === type)?.instance;
    };
    return {
        register,
        getConstructor
    };
}
