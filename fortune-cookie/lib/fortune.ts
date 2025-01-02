import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, TREASURY, FORTUNE_COST } from './constants';

export const getUserFortunePDA = (userPublicKey: PublicKey) => {
  return PublicKey.findProgramAddress(
    [Buffer.from('user-fortune'), userPublicKey.toBuffer()],
    PROGRAM_ID
  )[0];
};

export const generateFortuneTransaction = async (
  program: anchor.Program,
  userPublicKey: PublicKey
) => {
  const userFortunePDA = getUserFortunePDA(userPublicKey);
  
  return program.methods
    .generateFortune(new anchor.BN(FORTUNE_COST * anchor.web3.LAMPORTS_PER_SOL))
    .accounts({
      userFortune: userFortunePDA,
      user: userPublicKey,
      treasury: TREASURY,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();
};