import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("solana-twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;
  const anchorProvider = program.provider as anchor.AnchorProvider;
  const programId = anchor.web3.SystemProgram.programId;
  const author = anchorProvider.wallet.publicKey;

  it("can send a new tweet", async () => {
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("veganism", "Hummus, am I right?")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), author.toBase58());
    assert.equal(tweetAccount.topic, "veganism");
    assert.equal(tweetAccount.content, "Hummus, am I right?");
    // assert.equal(tweetAccount.likesCount, 0);
    assert.ok(tweetAccount.timestamp);
  });

  it("can send a new tweet without a topic", async () => {
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("", "gm")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), author.toBase58());
    assert.equal(tweetAccount.topic, "");
    assert.equal(tweetAccount.content, "gm");
    assert.ok(tweetAccount.timestamp);
  });

  it("can send a new tweet from a different author", async () => {
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(
      otherUser.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(signature);

    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction on behalf of this other user.
    await program.methods
      .sendTweet("veganism", "Yay Tofu!")
      .accounts({
        tweet: tweet.publicKey,
        author: otherUser.publicKey,
        systemProgram: programId,
      })
      .signers([otherUser, tweet])
      .rpc();

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(
      tweetAccount.author.toBase58(),
      otherUser.publicKey.toBase58()
    );
    assert.equal(tweetAccount.topic, "veganism");
    assert.equal(tweetAccount.content, "Yay Tofu!");
    assert.ok(tweetAccount.timestamp);
  });

  it("cannot provide a topic with more than 50 characters", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const topicWith51Chars = "x".repeat(51);

      // Call the "SendTweet" instruction.
      await program.methods
        .sendTweet(topicWith51Chars, "Hummus, am I right?")
        .accounts({
          tweet: tweet.publicKey,
          author: author,
          systemProgram: programId,
        })
        .signers([tweet])
        .rpc();
    } catch (error) {
      assert.equal(
        error.error.errorMessage,
        "The provided topic should be 50 characters long maximum."
      );
      return;
    }

    assert.fail(
      "The instruction should have failed with a 51-character topic."
    );
  });

  it("cannot provide a content with more than 280 characters", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const contentWith281Chars = "x".repeat(281);

      // Call the "SendTweet" instruction.
      await program.methods
        .sendTweet("veganism", contentWith281Chars)
        .accounts({
          tweet: tweet.publicKey,
          author: author,
          systemProgram: programId,
        })
        .signers([tweet])
        .rpc();
    } catch (error) {
      assert.equal(
        error.error.errorMessage,
        "The provided content should be 280 characters long maximum."
      );
      return;
    }

    assert.fail(
      "The instruction should have failed with a 281-character content."
    );
  });

  it("can fetch all tweets", async () => {
    const tweetAccounts = await program.account.tweet.all();
    assert.equal(tweetAccounts.length, 3);
  });

  it("can filter tweets by author", async () => {
    const tweetAccounts = await program.account.tweet.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: author.toBase58(),
        },
      },
    ]);

    assert.equal(tweetAccounts.length, 2);
    assert.ok(
      tweetAccounts.every((tweetAccount) => {
        return tweetAccount.account.author.toBase58() === author.toBase58();
      })
    );
  });

  it("can filter tweets by topics", async () => {
    const tweetAccounts = await program.account.tweet.all([
      {
        memcmp: {
          offset:
            8 + // Discriminator.
            32 + // Author public key.
            8 + // Timestamp.
            4, // Topic string prefix.
          bytes: bs58.encode(Buffer.from("veganism")),
        },
      },
    ]);

    assert.equal(tweetAccounts.length, 2);
    assert.ok(
      tweetAccounts.every((tweetAccount) => {
        return tweetAccount.account.topic === "veganism";
      })
    );
  });

  it("can update a tweet", async () => {
    // Send a tweet and fetch its account.
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("web2", "Hello World!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.topic, "web2");
    assert.equal(tweetAccount.content, "Hello World!");

    // Update the Tweet.
    await program.methods
      .updateTweet("solana", "gm everyone!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
      })
      .rpc();

    // Ensure the updated tweet has the updated data.
    const updatedTweetAccount = await program.account.tweet.fetch(
      tweet.publicKey
    );
    assert.equal(updatedTweetAccount.topic, "solana");
    assert.equal(updatedTweetAccount.content, "gm everyone!");
  });

  it("cannot update someone else's tweet", async () => {
    const anotherAuthor = anchor.web3.Keypair.generate().publicKey;
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("solana", "Solana is awesome!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Update the Tweet, or maybe not
    try {
      await program.methods
        .updateTweet("eth", "Ethereum is awesome!")
        .accounts({
          tweet: tweet.publicKey,
          author: anotherAuthor,
        })
        .rpc();

      assert.fail("We were able to update someone else's tweet.");
    } catch (error) {
      // Ensure the tweet account kept the initial data.
      const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
      assert.equal(tweetAccount.topic, "solana");
      assert.equal(tweetAccount.content, "Solana is awesome!");
    }
  });

  it("can delete a tweet", async () => {
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("solana", "Solana is awesome!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Delete the Tweet.
    await program.methods
      .deleteTweet()
      .accounts({
        tweet: tweet.publicKey,
        author: author,
      })
      .rpc();

    // Ensure fetching the tweet account returns null.
    const tweetAccount = await program.account.tweet.fetchNullable(
      tweet.publicKey
    );

    assert.ok(tweetAccount === null);
  });

  it("cannot delete someone else's tweet", async () => {
    const anotherAuthor = anchor.web3.Keypair.generate().publicKey;
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("solana", "Solana is awesome!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Try to delete the Tweet from a different author.
    try {
      await program.methods
        .deleteTweet()
        .accounts({
          tweet: tweet.publicKey,
          author: anotherAuthor,
        })
        .rpc();

      assert.fail("We were able to delete someone else's tweet.");
    } catch (error) {
      // Ensure the tweet account still exists with the right data.
      const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
      assert.equal(tweetAccount.topic, "solana");
      assert.equal(tweetAccount.content, "Solana is awesome!");
    }
  });

  it("owner can like his tweet", async () => {
    const tweet = anchor.web3.Keypair.generate();
    const like = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("veganism", "Hummus, am I right?")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Call the "AddLike" instruction.
    await program.methods
      .addLike(tweet.publicKey)
      .accounts({
        like: like.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([like])
      .rpc();

    // Fetch the account details of the created tweet.
    const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

    // Fetch the account details of the created like.
    const likeAccount = await program.account.like.fetch(like.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.author.toBase58(), author.toBase58());
    assert.equal(tweetAccount.topic, "veganism");
    assert.equal(tweetAccount.content, "Hummus, am I right?");
    assert.ok(tweetAccount.timestamp);

    assert.equal(likeAccount.author.toBase58(), author.toBase58());
    assert.equal(
      likeAccount.tweetPubkey.toBase58(),
      tweet.publicKey.toBase58()
    );
    assert.ok(likeAccount.timestamp);
  });

  // it("owner can not like his tweet twice", async () => {
  //   const tweet = anchor.web3.Keypair.generate();
  //   const like = anchor.web3.Keypair.generate();

  //   // Call the "SendTweet" instruction.
  //   await program.methods
  //     .sendTweet("veganism", "Hummus, am I right?")
  //     .accounts({
  //       tweet: tweet.publicKey,
  //       author: author,
  //       systemProgram: programId,
  //     })
  //     .signers([tweet])
  //     .rpc();

  //   // Call the "AddLike" instruction.
  //   await program.methods
  //     .addLike(tweet.publicKey)
  //     .accounts({
  //       like: like.publicKey,
  //       author: author,
  //       systemProgram: programId,
  //     })
  //     .signers([like])
  //     .rpc();

  //   // Fetch the account details of the created tweet.
  //   const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

  //   // Fetch the account details of the created like.
  //   const likeAccount = await program.account.like.fetch(like.publicKey);

  //   // Ensure it has the right data.
  //   assert.equal(tweetAccount.author.toBase58(), author.toBase58());
  //   assert.equal(tweetAccount.topic, "veganism");
  //   assert.equal(tweetAccount.content, "Hummus, am I right?");
  //   assert.ok(tweetAccount.timestamp);

  //   assert.equal(likeAccount.author.toBase58(), author.toBase58());

  //   assert.equal(
  //     likeAccount.tweetPubkey.toBase58(),
  //     tweet.publicKey.toBase58()
  //   );
  //   assert.ok(likeAccount.timestamp);
  // });

  it("can delete a like", async () => {
    const tweet = anchor.web3.Keypair.generate();
    const like = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("solana", "Solana is awesome!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    await program.methods
      .addLike(tweet.publicKey)
      .accounts({
        like: like.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([like])
      .rpc();

    // Delete the like.
    await program.methods
      .deleteLike()
      .accounts({
        like: like.publicKey,
        author: author,
      })
      .rpc();

    // Ensure fetching the like account returns null.
    const likeAccount = await program.account.like.fetchNullable(
      like.publicKey
    );

    assert.ok(likeAccount === null);
  });

  it("cannot delete someone else's like", async () => {
    const anotherAuthor = anchor.web3.Keypair.generate().publicKey;
    const tweet = anchor.web3.Keypair.generate();
    const like = anchor.web3.Keypair.generate();

    // Call the "SendTweet" instruction.
    await program.methods
      .sendTweet("solana", "Solana is awesome!")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    await program.methods
      .addLike(tweet.publicKey)
      .accounts({
        like: like.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([like])
      .rpc();

    //   // Fetch the account details of the created like.
    const likeAccount = await program.account.like.fetch(like.publicKey);

    // Try to delete the Tweet from a different author.
    try {
      await program.methods
        .deleteLike()
        .accounts({
          like: like.publicKey,
          author: anotherAuthor,
        })
        .rpc();

      assert.fail("We were able to delete someone else's like.");
    } catch (error) {
      // Ensure the like account still exists with the right data.
      assert.equal(likeAccount.author.toBase58(), author.toBase58());
      assert.equal(
        likeAccount.tweetPubkey.toBase58(),
        tweet.publicKey.toBase58()
      );
      assert.ok(likeAccount.timestamp);
    }
  });

  /// GIF Tweet
  it("can send a new GIF tweet", async () => {
    const tweet = anchor.web3.Keypair.generate();

    await program.methods
      .sendGifTweet("http//wwww.gif-tweet-url")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    const tweetAccount = await program.account.gifTweet.fetch(tweet.publicKey);

    assert.equal(tweetAccount.author.toBase58(), author.toBase58());
    assert.equal(tweetAccount.url, "http//wwww.gif-tweet-url");
    assert.ok(tweetAccount.timestamp);
  });

  it("can send a new GIF tweet from a different author", async () => {
    // Generate another user and airdrop them some SOL.
    const otherUser = anchor.web3.Keypair.generate();
    const signature = await program.provider.connection.requestAirdrop(
      otherUser.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(signature);

    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendGifTweet" instruction on behalf of this other user.
    await program.methods
      .sendGifTweet("http//wwww.gif-tweet-url")
      .accounts({
        tweet: tweet.publicKey,
        author: otherUser.publicKey,
        systemProgram: programId,
      })
      .signers([otherUser, tweet])
      .rpc();

    // Fetch the account details of the created GIF tweet.
    const tweetAccount = await program.account.gifTweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(
      tweetAccount.author.toBase58(),
      otherUser.publicKey.toBase58()
    );
    assert.equal(tweetAccount.url, "http//wwww.gif-tweet-url");
    assert.ok(tweetAccount.timestamp);
  });

  it("cannot provide an empty url", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();

      await program.methods
        .sendGifTweet("")
        .accounts({
          tweet: tweet.publicKey,
          author: author,
          systemProgram: programId,
        })
        .signers([tweet])
        .rpc();
    } catch (error) {
      assert.equal(error.error.errorMessage, "URL field should not be empty.");
      return;
    }

    assert.fail("The instruction should have failed with an empty url.");
  });

  it("cannot provide an url with more than 280 characters", async () => {
    try {
      const tweet = anchor.web3.Keypair.generate();
      const url281Chars = "x".repeat(281);

      // Call the "SendGifTweet" instruction.
      await program.methods
        .sendGifTweet(url281Chars)
        .accounts({
          tweet: tweet.publicKey,
          author: author,
          systemProgram: programId,
        })
        .signers([tweet])
        .rpc();
    } catch (error) {
      assert.equal(
        error.error.errorMessage,
        "The provided URL should be 280 characters long maximum."
      );
      return;
    }
  });

  it("can fetch all GIF tweets", async () => {
    const tweetAccounts = await program.account.gifTweet.all();
    assert.equal(tweetAccounts.length, 2);
  });

  it("can filter GIF tweets by author", async () => {
    const tweetAccounts = await program.account.gifTweet.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: author.toBase58(),
        },
      },
    ]);

    assert.equal(tweetAccounts.length, 1);
    assert.ok(
      tweetAccounts.every((tweetAccount) => {
        return tweetAccount.account.author.toBase58() === author.toBase58();
      })
    );
  });

  it("can update a GIF tweet", async () => {
    // Send a tweet and fetch its account.
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendGIFTweet" instruction.
    await program.methods
      .sendGifTweet("http//wwww.gif-tweet-url")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Fetch the account details of the created GIF tweet.
    const tweetAccount = await program.account.gifTweet.fetch(tweet.publicKey);

    // Ensure it has the right data.
    assert.equal(tweetAccount.url, "http//wwww.gif-tweet-url");

    // Update the Tweet.
    await program.methods
      .updateGifTweet("http//wwww.gif-tweet-url-2")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
      })
      .rpc();

    // Ensure the updated GIF tweet has the updated data.
    const updatedTweetAccount = await program.account.gifTweet.fetch(
      tweet.publicKey
    );
    assert.equal(updatedTweetAccount.url, "http//wwww.gif-tweet-url-2");
  });

  it("cannot update someone else's tweet", async () => {
    const anotherAuthor = anchor.web3.Keypair.generate().publicKey;
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendGifTweet" instruction.
    await program.methods
      .sendGifTweet("http//wwww.gif-tweet-url")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Fetch the account details of the created GIF tweet.
    const tweetAccount = await program.account.gifTweet.fetch(tweet.publicKey);

    // Update the GIF Tweet, or maybe not
    try {
      await program.methods
        .updateGifTweet("http//wwww.gif-tweet-url-2")
        .accounts({
          tweet: tweet.publicKey,
          author: anotherAuthor,
        })
        .rpc();

      assert.fail("We were able to update someone else's git tweet.");
    } catch (error) {
      // Ensure the GIF tweet account kept the initial data.
      const tweetAccount = await program.account.gifTweet.fetch(
        tweet.publicKey
      );
      assert.equal(tweetAccount.url, "http//wwww.gif-tweet-url");
    }
  });

  it("can delete a GIF tweet", async () => {
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendGIFTweet" instruction.
    await program.methods
      .sendGifTweet("http//wwww.gif-tweet-url")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Delete the GIF Tweet.
    await program.methods
      .deleteGifTweet()
      .accounts({
        tweet: tweet.publicKey,
        author: author,
      })
      .rpc();

    // Ensure fetching the GIF tweet account returns null.
    const tweetAccount = await program.account.gifTweet.fetchNullable(
      tweet.publicKey
    );

    assert.ok(tweetAccount === null);
  });

  it("cannot delete someone else's GIF tweet", async () => {
    const anotherAuthor = anchor.web3.Keypair.generate().publicKey;
    const tweet = anchor.web3.Keypair.generate();

    // Call the "SendGIFTweet" instruction.
    await program.methods
      .sendGifTweet("http//wwww.gif-tweet-url")
      .accounts({
        tweet: tweet.publicKey,
        author: author,
        systemProgram: programId,
      })
      .signers([tweet])
      .rpc();

    // Try to delete the Tweet from a different author.
    try {
      await program.methods
        .deleteGifTweet()
        .accounts({
          tweet: tweet.publicKey,
          author: anotherAuthor,
        })
        .rpc();

      assert.fail("We were able to delete someone else's GIF tweet.");
    } catch (error) {
      // Ensure the GIF tweet account still exists with the right data.
      const tweetAccount = await program.account.gifTweet.fetch(
        tweet.publicKey
      );
      assert.equal(tweetAccount.url, "http//wwww.gif-tweet-url");
    }
  });
});
