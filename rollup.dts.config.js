import dts from 'rollup-plugin-dts';

export default function createDTS() {
  return {
    input: `./temp/src/index.d.ts`,
    output: {
      file: `./dist/index.d.ts`,
      format: 'es',
    },
    plugins: [dts()],
    onwarn(warning, warn) {
      if (
        warning.code === 'UNRESOLVED_IMPORT' &&
        !warning.exporter?.startsWith('.')
      ) {
        return;
      }
      warn(warning);
    },
  };
}