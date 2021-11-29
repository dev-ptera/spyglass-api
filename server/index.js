const { PrismaClient } = require('.prisma/client');

const prisma = new PrismaClient();

prisma.representativeAccount.findMany({ include: { pingStats: true } }).then((accs) => {
    accs.forEach((acc) => {
        console.log(acc);
        console.log(acc.pingStats);
    });
});
