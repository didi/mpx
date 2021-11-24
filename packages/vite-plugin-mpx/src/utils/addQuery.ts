import qs from 'querystring'
import parseRequest from './parseRequest'

export default function addQuery(
  id: string,
  q: Record<string, unknown>
): string {
  const { filename, query } = parseRequest(id)
  return `${filename}?${qs.stringify({ ...query, ...q })}`
}
