require('dotenv').config({ path: '.env.local' });

console.log('=== Environment Variables Check ===\n');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ MISSING');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set (' + process.env.NEXTAUTH_SECRET.length + ' chars)' : '❌ MISSING');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set (' + process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...)' : '❌ MISSING');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set (' + process.env.GOOGLE_CLIENT_SECRET.length + ' chars)' : '❌ MISSING');
console.log('\n=== Status ===');
const allSet = process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
console.log(allSet ? '✅ All variables are set!' : '❌ Some variables are missing!');
