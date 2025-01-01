import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import idl from "../../target/idl/solana_fortune_cookie.json"; 
import { BN } from "@project-serum/anchor";

const FortuneForm = () => {
  const [fee, setFee] = useState(0);
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [fortune, setFortune] = useState("");
  const [error, setError] = useState("");

  const programId = new PublicKey("5o9iyA2bASAmQYNCUa7rPLRjVmSUSpD2d17Kun1bV8U5"); // Your Solana program ID
  const connection = new Connection(clusterApiUrl("devnet"));


  const generateFortune = async (fee: number): Promise<void> => {
    if (!connected || !publicKey || !wallet) {
      alert("Please connect your wallet.");
      return;
    }
  
    try {
      setLoading(true);
  
      const provider = new AnchorProvider(connection, wallet.adapter, {
        preflightCommitment: "processed",
      });
  
      const program: Program<any> = new Program(idl, programId, provider);

      const [userFortunePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("user-fortune"), publicKey.toBuffer()],
        program.programId
      );
  
      const feeBN = new BN(fee.toString());
  
      const tx = await program.methods
      .generateFortune(new BN(fee))
      .accounts({
        user: publicKey,
        treasury: program.provider.wallet.publicKey,
        userFortune: userFortunePDA[0],
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  
      setFortune("Your fortune has been generated!");
      setLoading(false);
      console.log("Transaction signature", tx);
    } catch (err) {
      console.error("Error generating fortune:", err);
      setError("Error generating fortune. Please try again.");
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>Generate Your Fortune</h1>
      {fortune && <p>{fortune}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="number"
        placeholder="Fee in SOL"
        onChange={(e) => setFee(Number(e.target.value))}
      />
      <button onClick={() => generateFortune(fee)} disabled={loading}>
        {loading ? "Processing..." : "Generate Fortune"}
      </button>
    </div>
  );
};

export default FortuneForm;
