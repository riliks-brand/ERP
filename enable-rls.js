// enable-rls.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Securing database... Enabling RLS on all tables...");
  
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'ALTER TABLE public."' || r.tablename || '" ENABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'Enabled RLS on %', r.tablename;
        END LOOP;
    END $$;
  `);

  console.log("Success! Row Level Security (RLS) is now enabled for all tables.");
  console.log("As we have no specific PostgREST policies, this acts as a strict DENY ALL for public client-side access.");
  console.log("Prisma server-side queries will continue to work normally as they use the postgres bypass role.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
