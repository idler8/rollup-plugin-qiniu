export default {
	input: 'src/index.js',
	output: [
		{
			file: 'dist/rollup-plugin-qiniu.cjs.js',
			format: 'cjs',
		},
		{
			file: 'dist/rollup-plugin-qiniu.es.js',
			format: 'es',
		},
	],
};
