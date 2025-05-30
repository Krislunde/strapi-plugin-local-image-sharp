'use strict'

const Router = require('@koa/router')
const { createIPX, ipxFSStorage } = require('ipx')
const { resolve } = require('path')
const { existsSync, mkdirSync } = require('fs')
const { createMiddleware } = require('./middleware')

function register({ strapi }) {
  const config = strapi.config.get('plugin::local-image-sharp')
  config.srcDir = strapi.dirs?.static?.public ?? strapi.dirs?.public

  strapi.log.info(`Using Local Image Sharp plugin`)
  strapi.log.info(`- Source directory: ${ config.srcDir }`)

  if (config.cacheDir) {
    const cwd = process.cwd()
    config.cacheDir = resolve(cwd, config.cacheDir)

    // prevent cache directory from being in source directory
    if (config.cacheDir.startsWith(config.srcDir)) {
      throw new Error('Cache directory cannot be inside source directory')
    }

    // check if directory exists
    if (!existsSync(config.cacheDir)) {
      mkdirSync(config.cacheDir, { recursive: true })
    }

    strapi.log.info(`- Cache directory: ${ config.cacheDir }`)
  }

  const router = new Router()

  config.paths.forEach((path) => {
    const ipx = createIPX({
      dir: config.srcDir + path,
      storage: ipxFSStorage({ dir: config.srcDir + path })
    })

    router.get(`${ path }/(.*)`, createMiddleware(ipx))
  })

  strapi.server.use(router.routes())
}

module.exports = {
  register
}
