const assert = require('assert');
const { getUser, deductCredits, upgradePlan } = require('../lib/projects-store');

async function testCreditsQuota() {
  console.log('\n======================================================');
  console.log('🧪 TESTING 150/600/1500 CREDITS & 3-PROMPT DAILY QUOTA');
  console.log('======================================================\n');

  const testUserId = `usr_test_${Date.now()}`;

  // 1. Initial State: Free Starter gets exactly 150 credits (3 prompts at 50 credits each)
  console.log('🔹 1. Testing Initial Free User Allocation...');
  const user1 = getUser(testUserId);
  console.log(`   User ID: ${user1.id}`);
  console.log(`   Plan: ${user1.plan}`);
  console.log(`   Credits: ${user1.credits} / ${user1.creditsLimit}`);
  console.log(`   Remaining Prompts: ${user1.remainingPrompts}`);
  assert.strictEqual(user1.credits, 150, 'Free user must start with 150 credits');
  assert.strictEqual(user1.remainingPrompts, 3, 'Free user must have exactly 3 prompts');

  // 2. First prompt generation (deducts 50 credits -> 100 left)
  console.log('\n🔹 2. Deducting Prompt 1 (50 credits)...');
  const d1 = deductCredits(testUserId, 50);
  assert.strictEqual(d1.success, true);
  assert.strictEqual(d1.credits, 100);
  assert.strictEqual(d1.remainingPrompts, 2);
  console.log(`   ✅ Remaining credits: ${d1.credits} (2 prompts left)`);

  // 3. Second prompt generation (deducts 50 credits -> 50 left)
  console.log('\n🔹 3. Deducting Prompt 2 (50 credits)...');
  const d2 = deductCredits(testUserId, 50);
  assert.strictEqual(d2.success, true);
  assert.strictEqual(d2.credits, 50);
  assert.strictEqual(d2.remainingPrompts, 1);
  console.log(`   ✅ Remaining credits: ${d2.credits} (1 prompt left)`);

  // 4. Third prompt generation (deducts 50 credits -> 0 left)
  console.log('\n🔹 4. Deducting Prompt 3 (50 credits)...');
  const d3 = deductCredits(testUserId, 50);
  assert.strictEqual(d3.success, true);
  assert.strictEqual(d3.credits, 0);
  assert.strictEqual(d3.remainingPrompts, 0);
  console.log(`   ✅ Remaining credits: ${d3.credits} (0 prompts left)`);

  // 5. Fourth prompt generation (must FAIL with INSUFFICIENT_CREDITS)
  console.log('\n🔹 5. Attempting Prompt 4 (Expected Failure)...');
  const d4 = deductCredits(testUserId, 50);
  assert.strictEqual(d4.success, false);
  assert.strictEqual(d4.error, 'INSUFFICIENT_CREDITS');
  console.log(`   ✅ Blocked as expected: "${d4.message}"`);
  console.log(`   ✅ Time until reset: ${Math.round(d4.timeUntilResetMs / 1000 / 60)} minutes`);

  // 6. Test Upgrade to Pro Developer (600 credits)
  console.log('\n🔹 6. Upgrading to Pro Developer ($19/mo)...');
  const upPro = upgradePlan(testUserId, 'pro');
  assert.strictEqual(upPro.success, true);
  assert.strictEqual(upPro.user.plan, 'Pro Developer');
  assert.strictEqual(upPro.user.credits, 600);
  assert.strictEqual(upPro.user.remainingPrompts, 12);
  console.log(`   ✅ Pro credits allocated: ${upPro.user.credits} (${upPro.user.remainingPrompts} prompts)`);

  // 7. Test Upgrade to Agency & Scale (1500 credits)
  console.log('\n🔹 7. Upgrading to Agency & Scale ($79/mo)...');
  const upAgency = upgradePlan(testUserId, 'agency');
  assert.strictEqual(upAgency.success, true);
  assert.strictEqual(upAgency.user.plan, 'Agency & Scale');
  assert.strictEqual(upAgency.user.credits, 1500);
  assert.strictEqual(upAgency.user.remainingPrompts, 30);
  console.log(`   ✅ Agency credits allocated: ${upAgency.user.credits} (${upAgency.user.remainingPrompts} prompts)`);

  console.log('\n======================================================');
  console.log('🎉 ALL CREDITS & DAILY QUOTA TESTS PASSED (7/7)!');
  console.log('======================================================\n');
}

testCreditsQuota().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
