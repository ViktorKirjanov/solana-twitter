use anchor_lang::prelude::*;

declare_id!("3rUnayciVyLhdoudmFxS55M213ykYjLP6PZvUtTstHKJ");

#[program]
pub mod solana_twitter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
