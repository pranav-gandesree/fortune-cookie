'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Cookie, Sparkles } from 'lucide-react';
import { useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { PROGRAM_ID } from '@/lib/constants';
import { generateFortuneTransaction, getUserFortunePDA } from '@/lib/fortune';

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [fortune, setFortune] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFortune = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const provider = new anchor.AnchorProvider(
        connection,
        window.solana,
        anchor.AnchorProvider.defaultOptions()
      );
      
      const program = new anchor.Program(IDL, PROGRAM_ID, provider);
      const tx = await generateFortuneTransaction(program, publicKey);
      
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      const userFortunePDA = getUserFortunePDA(publicKey);
      const userFortuneAccount = await program.account.userFortune.fetch(
        userFortunePDA
      );
      setFortune(userFortuneAccount.fortune);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-600 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Cookie className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solana Fortune Cookie
          </h1>
          <p className="text-gray-600">
            Get your fortune told on the Solana blockchain
          </p>
        </div>

        <div className="flex justify-center">
          <WalletMultiButton />
        </div>

        {publicKey && (
          <button
            onClick={getFortune}
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              'Reading your fortune...'
            ) : (
              <>
                <span>Get Fortune (0.01 SOL)</span>
                <Sparkles className="h-5 w-5" />
              </>
            )}
          </button>
        )}

        {fortune && (
          <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-100">
            <p className="text-purple-900 text-lg text-center font-medium">
              {fortune}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}