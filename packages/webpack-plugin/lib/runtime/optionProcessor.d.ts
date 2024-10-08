declare global {
  namespace NodeJS {
    interface Global {
      // @ts-ignore
      [key: string]: any
    }
  }
}

export function processComponentOption (...args: any): object

export function getComponent (...args: any): object

export function getWxsMixin (...args: any): object

export function processAppOption (...args: any): void
