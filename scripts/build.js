const fs = require('fs-extra')
const chalk = require('chalk')
const execa = require('execa')
const { gzipSync } = require('zlib')
const { compress } = require('brotli')

const files = [
  'dist/vue-router-vuex.esm-browser.js',
  'dist/vue-router-vuex.esm-browser.prod.js',
  'dist/vue-router-vuex.esm-bundler.js',
  'dist/vue-router-vuex.global.js',
  'dist/vue-router-vuex.global.prod.js',
  'dist/vue-router-vuex.cjs.js'
]

async function run() {
  await build()
  checkAllSizes()
}

async function build(config) {
  await execa('rollup', ['-c', 'rollup.config.js'], { stdio: 'inherit' })
}

function checkAllSizes() {
  files.map((f) => checkSize(f))
}

function checkSize(file) {
  const f = fs.readFileSync(file)
  const minSize = (f.length / 1024).toFixed(2) + 'kb'
  const gzipped = gzipSync(f)
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
  const compressed = compress(f)
  const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
  console.log(
    `${chalk.gray(
      chalk.bold(file)
    )} size:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
  )
}

run()
