use crate::Like;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddLike<'info> {
    #[account(init, payer = author, space = Like::LEN)]
    pub like: Account<'info, Like>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteLike<'info> {
    #[account(mut, has_one = author, close = author)]
    pub like: Account<'info, Like>,
    pub author: Signer<'info>,
}
