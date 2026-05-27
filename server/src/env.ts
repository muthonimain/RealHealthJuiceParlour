import dotenv from 'dotenv'
import path from 'path'

// Must be the very first module imported so env vars are available
// to all other modules when they load
dotenv.config({ path: path.join(__dirname, '../.env') })
