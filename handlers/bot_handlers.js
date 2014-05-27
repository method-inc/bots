var Bot = require('../models').Bot;
var User = require('../models').User;

module.exports = {
  listUserBots: function(req, res) {
    User.find(req.params.userId)
      .success(function(user) {
        user.getBots({
            attributes: ['id', 'url', 'UserId']
          }).success(function(bots) {
            res.render('botlist', {userId:req.params.userId, bots:bots});
          });
      });
  },

  createBot: function(req, res) {
    User.find(req.params.userId)
      .success(function(user) {
        Bot.create(req.body)
          .success(function(bot) {
            bot.setUser(user)
              .success(function(bot) {
                res.redirect('/users/' + req.params.userId + '/bots/' + bot.id);
              });
          });
      });
  },

  getBot: function(req, res) {
    Bot.find({
        where: {id:req.params.botId},
        attributes: ['id', 'url', 'UserId']
      }).success(function(bot) {
        res.render('bot', {bot:bot});
      });
  },

  editBot: function(req, res) {
    Bot.find(req.params.botId)
      .success(function(bot) {
        bot.updateAttributes(req.body)
          .success(function(bot) {
            res.render('bot', {bot:bot});
          });
      });
  },

  deleteBot: function(req, res) {
    Bot.find(req.params.botId)
      .success(function(bot) {
        bot.destroy()
          .success(function() {
            res.redirect('/users/' + req.params.userId + '/bots');
          });
      });
  }
};
