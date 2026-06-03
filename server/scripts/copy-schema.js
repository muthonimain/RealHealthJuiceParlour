const fs = require('fs')
const path = require('path')

const destDir = path.join(__dirname, '../dist/db')
fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(
  path.join(__dirname, '../src/db/schema.sql'),
  path.join(destDir, 'schema.sql')
)
