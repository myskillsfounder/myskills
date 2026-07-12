import { Generator, getConfig } from '@tanstack/router-generator'
const root = process.cwd()
const config = getConfig({ routesDirectory: root+'/src/routes', generatedRouteTree: root+'/src/routeTree.gen.ts' }, root)
await new Generator({ config, root }).run()
console.log('generated OK')
