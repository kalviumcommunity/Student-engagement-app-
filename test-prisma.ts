import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

async function main() {
    console.log('Connecting with PrismaClient...', process.env.DATABASE_URL)
    await prisma.$connect()
    console.log('SUCCESS: Prisma Client Connected!')
}

main()
    .catch(e => {
        console.error('FAILURE:', e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
