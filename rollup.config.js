import path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import ts from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const banner = `/*!
 /**
  * vue-router-vuex v${pkg.version}
  * (c) ${new Date().getFullYear()} zhanglin
  * @license MIT
  */`

const configs = [
  { file: 'dist/vue-router-vuex.esm-browser.js', format: 'es', browser: true, env: 'development' },
  { file: 'dist/vue-router-vuex.esm-browser.prod.js', format: 'es', browser: true, env: 'production' },
  { file: 'dist/vue-router-vuex.esm-bundler.js', format: 'es', env: 'development' },
  { file: 'dist/vue-router-vuex.global.js', format: 'iife', env: 'development' },
  { file: 'dist/vue-router-vuex.global.prod.js', format: 'iife', minify: true, env: 'production' },
  { file: 'dist/vue-router-vuex.cjs.js', format: 'cjs', env: 'development' }
]

export function createEntries() {
  return configs.map((c) => createEntry(c))
}

function createEntry(config) {
  const c = {
    input: 'src/index.ts',
    plugins: [],
    output: {
      banner,
      file: config.file,
      format: config.format
    },
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg)
      }
    }
  }

  if (config.format === 'iife' || config.format === 'umd') {
    c.output.name = c.output.name || 'VuexRouterVuex'
  }

  c.plugins.push(resolve())
  c.plugins.push(commonjs())

  c.plugins.push(ts({
    check: config.format === 'es' && config.browser && config.env === 'development',
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        declaration: config.format === 'es' && config.browser && config.env === 'development',
        target: config.format === 'iife' || config.format === 'cjs' ? 'es5' : 'es2018'
      },
      exclude: ['test']
    }
  }))

  if (config.minify) {
    c.plugins.push(terser({ module: config.format === 'es' }))
  }

  return c
}

export default createEntries()
