declare global {
  namespace NodeJS {
    interface Global {
      // @ts-ignore
      [key: string]: any
    }
  }
}

export function getComponent (...args: any): object
