import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Must be the very first module imported so env vars are available
// to all other modules when they load (always server/.env, not repo root)
const serverEnvPath = path.resolve(__dirname, '..', '.env')
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath, override: true })
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })
}
