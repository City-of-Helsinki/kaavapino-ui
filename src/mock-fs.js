const mockFs = {
  existsSync: () => false,
  readFileSync: () => '',
  writeFileSync: () => {},
  readFile: () => {},
  writeFile: () => {},
  stat: () => {},
  lstat: () => {},
  readdir: () => {},
  mkdir: () => {},
  rmdir: () => {},
  unlink: () => {}
};

//Export it using ESM syntax
export default mockFs;