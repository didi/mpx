declare global {
  namespace NodeJS {
    interface Global {
      [key: string]: any
    }
  }
}

export default function processOption (...args: any): object

export function getComponent (...args: any): object




