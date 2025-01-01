// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { SolanaFortuneCookie } from "../target/types/solana_fortune_cookie";
// import BN from "bn.js";
// import { Keypair, SystemProgram } from "@solana/web3.js";

// describe("solana-fortune-cookie", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.SolanaFortuneCookie as Program<SolanaFortuneCookie>;

//   let keypair = Keypair.generate();


//   it("Generates fortune with sufficient fee", async () => {
//     // Setup test user and treasury accounts
//     const user = anchor.web3.keypair.generate();
//     const treasury = anchor.web3.keypair.generate();

//       // Create the userFortune PDA using the seed and user key
//       const [userFortunePDA, bump] = await anchor.web3.PublicKey.findProgramAddress(
//         [Buffer.from("user-fortune"), user.publicKey.toBuffer()],
//         program.programId
//       );

//     // Set up the fee (e.g., 0.01 SOL in lamports)
//     const fee =new BN(10_000_000); // 0.01 SOL

   
//     // Simulate the interaction
//     const tx = await program.methods
//       .generateFortune(fee)
//       .accounts({
//         user: user.publicKey,
//         treasury: treasury.publicKey,
//         userFortune: userFortunePDA,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .signers([user]) // Sign with the user
//       .rpc();

//     console.log("Generated fortune transaction signature", tx);

//     // Add further assertions here (e.g., check userFortune, balance transfer, etc.)
//   });
// });










import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { SolanaFortuneCookie } from "../target/types/solana_fortune_cookie";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("solana-fortune-cookie", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaFortuneCookie as Program<SolanaFortuneCookie>;

  let user: Keypair;
  let treasury: Keypair;

  // PDA for the user fortune account
  let userFortunePda: anchor.web3.PublicKey;
  let userFortuneBump: number;

  const FEE = 10_000_000; // 0.01 SOL

  before(async () => {
    // Create a user and treasury wallet for testing
    user = Keypair.generate();
    treasury = Keypair.generate();

    // Airdrop SOL to the user and treasury wallets
    const airdropTx = await provider.connection.requestAirdrop(user.publicKey, 1_000_000_000); // 1 SOL
    await provider.connection.confirmTransaction(airdropTx);

    const treasuryAirdropTx = await provider.connection.requestAirdrop(treasury.publicKey, 1_000_000_000); // 1 SOL
    await provider.connection.confirmTransaction(treasuryAirdropTx);

    // Find the PDA for the user's fortune account
    [userFortunePda, userFortuneBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("user-fortune"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  it("generates a fortune successfully", async () => {
    // Call the generate_fortune instruction
    const tx = await program.methods
      .generateFortune(new anchor.BN(FEE))
      .accounts({
        userFortune: userFortunePda,
        user: user.publicKey,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch the user fortune account
    const userFortuneAccount = await program.account.userFortune.fetch(userFortunePda);

    // Assert the generated fortune is valid
    assert.ok(userFortuneAccount.authority.equals(user.publicKey));
    assert.isTrue(
      [
        "Good things are coming your way!",
        "Seize the day, it's yours to conquer!",
        "A great opportunity awaits you!",
        "Someone is thinking about you right now.",
        "Be brave, fortune favors the bold!",
      ].includes(userFortuneAccount.fortune)
    );

    console.log("Generated fortune:", userFortuneAccount.fortune);
  });

  it("fails with insufficient fee", async () => {
    try {
      await program.methods
        .generateFortune(new anchor.BN(FEE / 2)) // Insufficient fee: 0.005 SOL
        .accounts({
          userFortune: userFortunePda,
          user: user.publicKey,
          treasury: treasury.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("The transaction should have failed due to insufficient fee.");
    } catch (err) {
      assert.ok(err.error.errorCode.code === "InsufficientFee");
      console.log("Error received as expected:", err.error.errorMessage);
    }
  });
});


