const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@jmc.com"; // Put your email here
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'MANAGER' },
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: 'hashed_password_here', // Be careful with plain text passwords
      role: 'MANAGER',
    },
  });
  console.log({ admin });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());