const fs = require('fs');
const he = require('he');
const async = require('async');
const Fanfou = require('fanfou-sdk');
const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  OAUTH_TOKEN,
  OAUTH_TOKEN_SECRET,
} = require('./config');
const {
  BOTS,
  BLACKLIST,
} = require('./banned');

const ff = new Fanfou({
  auth_type: 'oauth',
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  oauth_token: OAUTH_TOKEN,
  oauth_token_secret: OAUTH_TOKEN_SECRET,
});

ff.get('/statuses/public_timeline', {count: 60}, (e, res, timeline) => {
  if (e) {
    console.error(e);
  } else {
    async.eachSeries(timeline, (status, callback) => {
      if (!status.hasOwnProperty('id')) callback(null);
      else if (status.isReply() || status.isRepost() || status.isOriginRepost()) callback(null);
      else if (!isFlag(status)) callback(null);
      else {
        ff.post('/statuses/update', {
          status: 'FLAG@' + status.user.name + ' ' + he.decode(status.text),
          repost_status_id: status.id
        }, (e, res) => {
          if (e) console.error(e);
          else console.log(res);
        });
      }
    });
  }
});

function isOriginalStatus(status) {
  if (status.hasOwnProperty('repost_status_id') && status.repost_status_id !== '') return false;
  if (inBannedList(status.user.id)) return false;
  if (status.in_reply_to_status_id !== '') return false;
  if (status.in_reply_to_user_id !== '') return false;
  if (status.text.match(/转@/g)) return false;
  return true;
}

function isFlag(status) {
  return (status.text.toLowerCase().match(/立个flag/g));
}

function inBannedList(id) {
  for (let i = 0; i < BOTS.length; i++) {
    if (BOTS[i] === id) {
      return true;
    }
  }
  for (let i = 0; i < BLACKLIST.length; i++) {
    if (BLACKLIST[i] === id) {
      return true;
    }
  }
  return false;
}
