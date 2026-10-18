# Arkiv friction report

Tested against `@arkiv-network/sdk` 0.8.x and Tiramisu.

## 1. Public reads and wallet writes use two clients

**Reproduction:** follow the Querying Data guide, then add browser publishing.

**Observed:** `createPublicClient` owns reads while `createWalletClient` owns writes. This separation is defensible, but first-time builders often expect one connected client after wallet connection.

**Suggestion:** add an end-to-end browser recipe at the top of the docs that creates both clients together and explains why.

## 2. Network switching is left to application code

**Reproduction:** connect MetaMask while it is on another chain and attempt `createEntity`.

**Observed:** the write fails or requires the app to implement the EIP-3085/EIP-3326 switching flow separately.

**Suggestion:** expose a documented `ensureChain()` helper or a canonical snippet containing Tiramisu chain metadata and error handling.

## 3. Empty-query UX can look like a failure

**Reproduction:** query a valid project/type pair before the first entity exists.

**Observed:** the SDK correctly returns an empty result, but a demo cannot distinguish “network healthy, zero entities” from a mocked fallback unless the application adds explicit state.

**Suggestion:** document a small connection-health check alongside the first query example.

## 4. Expiry is powerful but block time is non-obvious

**Reproduction:** display `expiresAt` to a non-chain user.

**Observed:** the protocol returns a block height; product UIs need to convert it into a time estimate, and that estimate can drift.

**Suggestion:** include an SDK display helper returning an estimated date plus a clearly labelled confidence/drift range.

## What worked well

Typed attribute constructors prevent accidental query/schema mismatches. Payload/attribute separation is clear, public reads require no wallet, and native expiry maps unusually well to time-sensitive public information such as mandi prices.
