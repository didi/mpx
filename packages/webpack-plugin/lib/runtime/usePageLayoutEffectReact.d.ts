declare global {
  namespace NodeJS {
    interface Global {
      [key: string]: any
    }
  }
}

export default function usePageLayoutEffect(...args: any): void
