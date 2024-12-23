// declare_id!("5o9iyA2bASAmQYNCUa7rPLRjVmSUSpD2d17Kun1bV8U5");


use anchor_lang::prelude::*;

declare_id!("5o9iyA2bASAmQYNCUa7rPLRjVmSUSpD2d17Kun1bV8U5");

#[program]
pub mod solana_fortune_cookie {
    use super::*;

    // Instruction to generate a fortune
    pub fn generate_fortune(ctx: Context<GenerateFortune>, fee: u64) -> Result<()> {
        let user_fortune = &mut ctx.accounts.user_fortune;

        // Ensure fee is sufficient
        if fee < 10_000_000 { // Example: 0.01 SOL
            return err!(ErrorCode::InsufficientFee);
        }

        // Fetch randomness using Clock Sysvar
        let clock: Clock = Clock::get().unwrap();
        let random_seed = clock.unix_timestamp;
        let index = (random_seed % FORTUNES.len() as i64) as usize;

        // Update the user's fortune account
        user_fortune.authority = ctx.accounts.user.key();
        user_fortune.fortune = FORTUNES[index].to_string();

        // Log the generated fortune for debugging
        msg!("Generated fortune for user {}: {}", ctx.accounts.user.key(), FORTUNES[index]);

        // Transfer the fee to the treasury account
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.treasury.key(),
            fee,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;

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

// Accounts for the `generate_fortune` instruction
#[derive(Accounts)]
pub struct GenerateFortune<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 280, // 8 bytes for discriminator, 32 for Pubkey, 280 for string
        seeds = [b"user-fortune", user.key().as_ref()],
        bump
    )]
    pub user_fortune: Account<'info, UserFortune>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

// Data account structure for storing user-specific fortune data
#[account]
pub struct UserFortune {
    pub authority: Pubkey, // User's wallet address
    pub fortune: String,   // The user's last fortune
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("The fee sent is insufficient. Please send at least 0.01 SOL.")]
    InsufficientFee,
}
