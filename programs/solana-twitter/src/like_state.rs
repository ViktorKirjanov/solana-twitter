use crate::constants;
use anchor_lang::prelude::*;
use constants::*;

// Define the structure of the Like account.
#[account]
pub struct Like {
    pub author: Pubkey,
    pub timestamp: i64,
    pub tweet_pubkey: Pubkey,
}

// Constant on the Like account that provides its total size.
impl Like {
    pub const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Like Author.
        + TIMESTAMP_LENGTH //Timestamp.
        + PUBLIC_KEY_LENGTH; // Tweet Pubkey.
}
