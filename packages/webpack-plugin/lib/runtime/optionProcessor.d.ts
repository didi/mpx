declare global {
  namespace NodeJS {
    interface Global {
      [key: string]: any
    }
  }
  interface Window {
     mpxGlobal: Record<string, any>
  }
}

declare const mpxGlobal: Record<string, any>

export function processComponentOption (...args: any): object

export function getComponent (...args: any): object

export function getWxsMixin (...args: any): object

export function processAppOption (...args: any): void
