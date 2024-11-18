import { Image } from './Image'
import CanvasGradient from './CanvasGradient'
import ImageData from './ImageData'
import { Instance, WebviewConstructor } from './utils'

export enum ConstructorType {
  Image = 'Image',
  CanvasGradient = 'CanvasGradient',
  ImageData = 'ImageData'
}

interface Constructor {
  type: ConstructorType
  instance: new (...args: any[]) => Instance
}

export class ConstructorsRegistry {
  private static constructors: Constructor[] = [
    { type: ConstructorType.Image, instance: Image },
    { type: ConstructorType.CanvasGradient, instance: CanvasGradient },
    { type: ConstructorType.ImageData, instance: ImageData }
  ]

  static register (registerWebviewConstructor: Function): void {
    this.constructors.forEach(({ type, instance }) => {
      registerWebviewConstructor(instance, type)
    })
  }

  static get (type: ConstructorType): WebviewConstructor | undefined {
    return this.constructors.find(c => c.type === type)?.instance
  }
}
