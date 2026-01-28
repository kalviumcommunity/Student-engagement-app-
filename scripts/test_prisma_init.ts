
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['info'] })

async function main() {
    try {
        const count = await prisma.user.count()
        console.log('SUCCESS: User count is ' + count)
    } catch (e) {
        console.error('FAILURE:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
