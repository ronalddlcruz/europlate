import { createApp, env } from './src/app.js'

// El watcher reinicia este proceso cuando cambia la configuración del servidor y Prisma.

const app = createApp()
app.listen(env.PORT, () => {
  const reset = '\x1b[0m'
  const green = '\x1b[32m'
  const cyan = '\x1b[36m'
  const yellow = '\x1b[33m'
  const dim = '\x1b[2m'
  console.info(`\n${green}🚀 Europlate ERP API iniciado correctamente${reset}`)
  console.info(`${cyan}🌐 Puerto:${reset} ${env.PORT}`)
  console.info(`${yellow}🛡️ Ambiente:${reset} ${env.NODE_ENV}`)
  console.info(`${dim}🔗 http://localhost:${env.PORT}${reset}\n`)
})
