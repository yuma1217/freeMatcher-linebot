const express = require('express');
const line = require('@line/bot-sdk');
const redisClient = require('redis').createClient(process.env.REDIS_URL);
require('dotenv').config();

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text' || event.source.type == 'group') {
    return Promise.resolve(null);
  }

  // userId取得
  const userId = event.source.userId;
  const reqMessage = event.message.text
  switch(reqMessage){
    case "スタンド":
        redisClient.sadd("userIds",userId)
        
        redisClient.quit();
        return client.replyMessage(event.replyToken,{
            type: 'text',
            text: '待機'
        })
    
    case "アンスタンド":
        // userId取得
        redisClient.srem("userIds",userId)
        return client.replyMessage(event.replyToken,{
            type: 'text',
            text: '待機状態の人をやめます'
        })
    
    case "キャッチ":
        const standUsers = await redisClient.smembers("userIds", function (err, replies) {
            return ["standUsersの取得に失敗しました"]
            if(!err){
                console.log(replies);
                return replies;
            }
        })
        console.log(standUsers)
        return client.replyMessage(event.replyToken,{
            type: 'text',
            text: '待機状態の人をお知らせします\n' + standUsers.join("\n")
        })
    case "ヘルプ":
        return client.replyMessage(event.replyToken,{
            type: 'text',
            text: 'このBotが出来ることを教えます'
        })
    case "意見":
        return client.replyMessage(event.replyToken,{
            type: 'text',
            text: '何か開発者に意見をお願いします'
        })
  }
  
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text //実際に返信の言葉を入れる箇所
  });
}

module.exports = app