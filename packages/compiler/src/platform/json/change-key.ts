export default function changeKey (input: Record<string, any>, srcKey: string, targetKey: string) {
  const value = input[srcKey]
  delete input[srcKey]
  input[targetKey] = value
  return input
}
