// Seed script - no longer needed as we use Supabase
// This file is kept for reference but does nothing

async function main() {
  // No-op seed for now
  console.log('Seed script: No seeding needed with Supabase')
}

main().then(() => {
  console.log('Seed completed')
  process.exit(0)
}).catch((error) => {
  console.error('Seed error:', error)
  process.exit(1)
})
