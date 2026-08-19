export function pluralize(word: string): string {
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es'
  }
  if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies'
  }
  if (word.endsWith('f') || word.endsWith('fe')) {
    return word.endsWith('fe') ? word.slice(0, -2) + 'ves' : word.slice(0, -1) + 'ves'
  }
  if (word.endsWith('o')) {
    return word + 'es'
  }
  return word + 's'
}
