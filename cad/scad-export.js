// Inline declared, self-contained include libraries at their original position.
// Keeping assignment order matters: Gridfinity overrides follow the include.
// Do not flatten `use`: executing a library's top-level geometry changes its meaning.
export async function standaloneScad(source, files, readContents) {
  const libraries = new Map(files.map(file => [file.name, file]));
  async function expand(text, stack = []) {
    const directives = /^[ \t]*(include|use)[ \t]*<([^>\r\n]+)>[ \t]*;?[ \t]*(?:\/\/[^\r\n]*)?$/gm;
    let result = '', end = 0;
    for (const match of text.matchAll(directives)) {
      const name = match[2].trim();
      if (match[1] === 'use') throw new Error('Cannot inline use directive: ' + name);
      if (stack.includes(name)) throw new Error('Cyclic SCAD include: ' + name);
      const file = libraries.get(name);
      if (!file) throw new Error('Missing SCAD library: ' + name);
      const contents = file.contents ?? await readContents(file);
      result += text.slice(end, match.index) + '// Bundled library: ' + name + '\n'
        + await expand(contents, [...stack, name]) + '\n';
      end = match.index + match[0].length;
    }
    return result + text.slice(end);
  }
  return expand(source);
}
