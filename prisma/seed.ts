
console.log("--- prisma/seed.ts execution started --- VERY TOP");

async function main() {
  console.log("--- main() function in seed.ts started ---");
  console.log("This is a minimal seed script test. If you see this, the script file is being executed by Node.js.");
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log("--- main() function in seed.ts finished ---");
}

console.log("--- Calling main() from seed.ts ---");
main()
  .then(() => {
    console.log('--- Seeding script main() promise resolved. Minimal execution finished successfully. ---');
    // process.exit(0); // Temporarily remove explicit exit to see if Prisma CLI shows more output
  })
  .catch(async (e) => {
    console.error('--- Critical error in main seed runner (main promise rejected): ---');
    console.error("Error Name: ", e.name);
    console.error("Error Message: ", e.message);
    console.error("Error Stack: ", e.stack);
    // process.exit(1); // Temporarily remove explicit exit
  })
  .finally(() => {
    console.log("--- main() promise chain finally block reached ---");
  });

console.log("--- prisma/seed.ts execution reached end of file --- VERY BOTTOM");
