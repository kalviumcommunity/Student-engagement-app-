import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Hash passwords with bcrypt (salt rounds = 10)
    const mentorPassword = await bcrypt.hash('SecureMentorPass123!', 10)
    const studentPassword = await bcrypt.hash('SecureStudentPass456!', 10)

    // 1. Create a Mentor
    const mentor = await prisma.user.upsert({
        where: { email: 'mentor@school.com' },
        update: {},
        create: {
            email: 'mentor@school.com',
            name: 'Mr. Stark',
            password: mentorPassword,
            role: 'MENTOR',
        },
    })

    // 2. Create a Student
    const student = await prisma.user.upsert({
        where: { email: 'student@school.com' },
        update: {},
        create: {
            email: 'student@school.com',
            name: 'Peter Parker',
            password: studentPassword,
            role: 'STUDENT',
        },
    })

    console.log({ mentor, student })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
