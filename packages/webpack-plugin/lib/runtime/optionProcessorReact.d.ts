declare global {
  namespace NodeJS {
    interface Global {
      [key: string]: any
    }
  }
}

export function getComponent (...args: any): object
