use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::clock::Clock;

declare_id!("5o9iyA2bASAmQYNCUa7rPLRjVmSUSpD2d17Kun1bV8U5");

#[program]
pub mod solana_fortune_cookie {
    use super::*;

    pub fn get_fortune(ctx: Context<Initialize>, fee:u64) -> Result<()> {
        let user_fortune = &mut ctx.accounts.user_fortune;

        if fee < 10_000_000 { // Example: 0.01 SOL
            return err!(ErrorCode::InsufficientFee);
        }

        // Fetch randomness (e.g., from Clock Sysvar)
    let clock: Clock = Clock::get().unwrap();
    let random_seed = clock.unix_timestamp;
    let index = (random_seed % FORTUNES.len() as i64) as usize;

    // Update user fortune
    user_fortune.authority = ctx.accounts.user.key();
    user_fortune.fortune = FORTUNES[index].to_string();

  
    // Log the generated fortune for debugging
    msg!("Generated fortune for user {}: {}", ctx.accounts.user.key(), FORTUNES[index]);

    Ok(())

    }
}



// Constants: Predefined list of fortunes
pub const FORTUNES: [&str; 5] = [
    "Good things are coming your way!",
    "Seize the day, it's yours to conquer!",
    "A great opportunity awaits you!",
    "Someone is thinking about you right now.",
    "Be brave, fortune favors the bold!",
];


#[derive(Accounts)]
pub struct GenerateFortune<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 280, // 8 bytes for account discriminator, 32 for Pubkey, 280 for string
        seeds = [b"user-fortune", user.key().as_ref()],
        bump
    )]
    pub user_fortune: Account<'info, UserFortune>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}


#[account]
pub struct UserFortune {
    pub authority: Pubkey, // The user's wallet address
    pub fortune: String,   // The last fortune generated
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("The fee sent is insufficient. Please send at least 0.01 SOL.")]
    InsufficientFee,
}