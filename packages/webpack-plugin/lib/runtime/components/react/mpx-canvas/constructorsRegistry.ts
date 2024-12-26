import { Image } from './Image'
import CanvasGradient from './CanvasGradient'
import ImageData from './ImageData'
import { WebviewConstructor } from './utils'

export enum ConstructorType {
  Image = 'Image',
  CanvasGradient = 'CanvasGradient',
  ImageData = 'ImageData'
}

interface Constructor {
  type: ConstructorType
  instance: WebviewConstructor
}

const constructors: Constructor[] = [
  { type: ConstructorType.Image, instance: Image },
  { type: ConstructorType.CanvasGradient, instance: CanvasGradient },
  { type: ConstructorType.ImageData, instance: ImageData }
]

export function useConstructorsRegistry () {
  const register = (registerWebviewConstructor: Function): void => {
    constructors.forEach(({ type, instance }) => {
      registerWebviewConstructor(instance, type)
    })
  }

  const getConstructor = (type: ConstructorType): WebviewConstructor | undefined => {
    return constructors.find(c => c.type === type)?.instance
  }

  return {
    register,
    getConstructor
  }
}
