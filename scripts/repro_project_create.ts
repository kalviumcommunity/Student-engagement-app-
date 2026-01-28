
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()
console.log("DEBUG: DATABASE_URL=", process.env.DATABASE_URL);


async function main() {
    const MENTOR_ID = '6f88a582-870c-4bae-9121-f2d95648f178';

    console.log(`Checking if user ${MENTOR_ID} exists...`);
    const user = await prisma.user.findUnique({
        where: { id: MENTOR_ID }
    });

    if (!user) {
        console.error('USER NOT FOUND IN DB! This explains the FK error.');
        return;
    }
    console.log('User found:', user);

    console.log('Attempting to create project...');
    try {
        const project = await prisma.project.create({
            data: {
                title: 'Test Project via Script',
                mentorId: MENTOR_ID
            }
        });
        console.log('Project created successfully:', project);

        // Cleanup
        await prisma.project.delete({ where: { id: project.id } });
        console.log('Test project deleted.');
    } catch (e) {
        console.error('FAILED to create project:', e);
    }
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
