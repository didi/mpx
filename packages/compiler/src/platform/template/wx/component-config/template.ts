const TAG_NAME = 'template'

export default function () {
  return {
    test: TAG_NAME,
    props: [
      {
        test: 'data',
        swan ({ name, value }) {
          return {
            name,
            value: `{${value}}`
          }
        }
      }
    ]
  }
}

