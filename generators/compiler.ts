export interface Compiler {
  name: string;
  c?: string;
  cc?: string;
};

type CompilerList = Array<Compiler>;

export default [
  {
    name: `clang`,
    c: `clang`,
    cc: `clang++`,
  },
  {
    name: `gcc`,
    c: `gcc`,
    cc: `g++`,
  }
] as CompilerList;