use crate::GifTweet;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SendGifTweet<'info> {
    #[account(init, payer = author, space = GifTweet::LEN)]
    pub tweet: Account<'info, GifTweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateGifTweet<'info> {
    #[account(mut, has_one = author)]
    pub tweet: Account<'info, GifTweet>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteGifTweet<'info> {
    #[account(mut, has_one = author, close = author)]
    pub tweet: Account<'info, GifTweet>,
    pub author: Signer<'info>,
}
