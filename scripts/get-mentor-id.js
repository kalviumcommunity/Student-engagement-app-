const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mentor = await prisma.user.findFirst({
        where: { role: 'MENTOR' },
        select: { id: true }
    });
    if (mentor) {
        console.log('MENTOR_ID:' + mentor.id);
    } else {
        console.log('NO_MENTOR_FOUND');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
