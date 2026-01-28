import 'dotenv/config'
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()

async function main() {
    try {
        const mentor = await prisma.user.upsert({
            where: { email: 'mentor@school.com' },
            update: {},
            create: {
                email: 'mentor@school.com',
                name: 'Mr. Stark',
                password: 'hashed_password_123',
                role: 'MENTOR',
            },
        })
        console.log('MENTOR_ID=' + mentor.id)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
