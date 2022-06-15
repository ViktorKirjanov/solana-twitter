pub mod constants;
pub mod errors;
pub mod gif_tweet_instruction;
pub mod gif_tweet_state;
pub mod like_instruction;
pub mod like_state;
pub mod tweet_instruction;
pub mod tweet_state;

use anchor_lang::prelude::*;
use constants::*;
use gif_tweet_instruction::*;
use gif_tweet_state::*;
use like_instruction::*;
use like_state::*;
use tweet_instruction::*;
use tweet_state::*;

declare_id!("3rUnayciVyLhdoudmFxS55M213ykYjLP6PZvUtTstHKJ");

#[program]
pub mod solana_twitter {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if topic.chars().count() > MAX_TOPIC_STRING_LENGTH {
            return Err(error!(errors::ErrorCode::TopicTooLong));
        }

        if content.chars().count() > MAX_CONTENT_STRING_LENGTH {
            return Err(error!(errors::ErrorCode::ContentTooLong));
        }

        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }

    pub fn update_tweet(ctx: Context<UpdateTweet>, topic: String, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;

        if topic.chars().count() > MAX_TOPIC_STRING_LENGTH {
            return Err(errors::ErrorCode::TopicTooLong.into());
        }

        if content.chars().count() > MAX_CONTENT_STRING_LENGTH {
            return Err(errors::ErrorCode::ContentTooLong.into());
        }

        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }

    pub fn delete_tweet(_ctx: Context<DeleteTweet>) -> Result<()> {
        Ok(())
    }

    pub fn add_like(ctx: Context<AddLike>, tweet_pubkey: Pubkey) -> Result<()> {
        let like: &mut Account<Like> = &mut ctx.accounts.like;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        //todo: check if like has been already added

        like.author = *author.key;
        like.timestamp = clock.unix_timestamp;
        like.tweet_pubkey = tweet_pubkey;

        Ok(())
    }

    pub fn delete_like(_ctx: Context<DeleteLike>) -> Result<()> {
        Ok(())
    }

    pub fn send_gif_tweet(ctx: Context<SendGifTweet>, url: String) -> Result<()> {
        let tweet: &mut Account<GifTweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if url.chars().count() == 0 {
            return Err(error!(errors::ErrorCode::URLEmpty));
        }

        if url.chars().count() > MAX_URL_STRING_LENGTH {
            return Err(error!(errors::ErrorCode::URLTooLong));
        }

        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.url = url;

        Ok(())
    }

    pub fn update_gif_tweet(ctx: Context<UpdateGifTweet>, url: String) -> Result<()> {
        let tweet: &mut Account<GifTweet> = &mut ctx.accounts.tweet;

        if url.chars().count() == 0 {
            return Err(error!(errors::ErrorCode::URLEmpty));
        }

        if url.chars().count() > MAX_URL_STRING_LENGTH {
            return Err(error!(errors::ErrorCode::URLTooLong));
        }

        tweet.url = url;

        Ok(())
    }

    pub fn delete_gif_tweet(_ctx: Context<DeleteGifTweet>) -> Result<()> {
        Ok(())
    }
}
