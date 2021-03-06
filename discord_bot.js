/*
========================
	This is a "ping-pong bot"
  Everytime a message matches a command, the bot will respond.
========================
*/
var VersionChecker	= require("./runtime/versioncheck");

var Cleverbot = require('cleverbot-node');
var cleverbot = new Cleverbot();

var maintenance;

var version = require("./package.json").version;

var Discord = require("discord.js");

var yt = require("./runtime/youtube_plugin");
var youtube_plugin = new yt();

var min = 1;
var max = 671;

var cmdPrefix = require("./config.json").command_prefix;

var aliases;

//Allowed send file types for !iff
var ext = [".jpg",".jpeg",".gif",".png"];
var imgDirectory = require("./config.json").image_folder;


var gi = require("./runtime/google_image_plugin");
var google_image_plugin = new gi();

// Get the email and password
var ConfigFile = require("./config.json");
var qs = require("querystring");

var htmlToText = require('html-to-text');

var config = {
    "api_key": "dc6zaTOxFJmzC",
    "rating": "r",
    "url": "http://api.giphy.com/v1/gifs/search",
    "permission": ["NORMAL"]
};

var meme = require("./runtime/memes.json");

var game_abbreviations = require("./runtime/abbreviations.json");

var cmdLastExecutedTime = {};

var admin_ids = require("./config.json").admin_ids;

/*
========================
Commands.

These are the commands, as described in the wiki, they can be adjusted to your needs.
None of the commands given here are required for the bot to run.
========================
*/

var commands = {
	"gif": {
		usage: "<image tags>",
        description: "Returns a random gif matching the tags passed.",
		process: function(bot, msg, suffix) {
		    var tags = suffix.split(" ");
		    get_gif(tags, function(id) {
			if (typeof id !== "undefined") {
			    bot.sendMessage(msg.channel, "http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
			else {
			    bot.sendMessage(msg.channel, "Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
		    });
      }
    },
    "maintenance-mode": {
        adminOnly: true,
        description: "Enables maintenance mode.",
        usage: "<time-in-seconds>",
        process: function(bot,msg,suffix){
            console.log("Maintenance mode activated for " + suffix + " seconds.");
            bot.sendMessage(msg.channel, "The bot is now in maintenance mode, commands **will NOT** work!" );
            bot.setPlayingGame(525);
            bot.setStatusIdle();
            maintenance = "true";
            setTimeout(continueExecution, Math.round(suffix * 1000));
            function continueExecution(){
              console.log("Maintenance ended.");
              bot.sendMessage(msg.channel, "Maintenance period ended, returning to normal.");
              bot.setPlayingGame(308);
              bot.setStatusOnline();
              maintenance = null;
            }
        }
    },
    "ping": {
        description: "Responds pong, useful for checking if bot is alive.",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, " "+msg.sender+" pong!");
            if(suffix){
                bot.sendMessage(msg.channel, "note that !ping takes no arguments!");
            }
        }
    },
    "setgame": {
        description: "Sets the playing status to a specified game.",
        usage: "<game-id>",
        process: function(bot, msg, suffix) {
            bot.setPlayingGame(suffix);
            console.log("The playing status has been changed to " + suffix + " by " + msg.sender.username);
        }
    },
    "cleverbot": {
        description: "Talk to Cleverbot!",
        usage: "<message>",
        process: function(bot, msg, suffix) {
          Cleverbot.prepare(function(){
            bot.startTyping(msg.channel);
                cleverbot.write(suffix, function (response) {
                     bot.sendMessage(msg.channel, response.message);
                     bot.stopTyping(msg.channel);
                   }
                 );
               }
             );
           }
    },
    "devs": {
        description: "Prints the devs of DougleyBot to the channel.",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Made with love by <@107904023901777920> and <@108125505714139136>. <3 <@110147170740494336> did stuff too.");
        }
    },
    "status": {
        description: "Prints the stats from the instance into the chat.",
        process: function(bot, msg, suffix) {
          var msgArray = [];
            msgArray.push("My uptime is " + (Math.round(bot.uptime/(1000*60*60))) + " hours, " + (Math.round(bot.uptime/(1000*60))%60) + " minutes, and " + (Math.round(bot.uptime/1000)%60) + " seconds.");
            msgArray.push("Currently, I'm in " + bot.servers.length + " servers, and in " + bot.channels.length + " channels.");
            msgArray.push("Currently, I'm serving " + bot.users.length + " users.");
            msgArray.push("To Discord, I'm known as " + bot.user + ", and I'm running DougleyBot version " + version);
            console.log(msg.sender.username + " requested the bot status.");
            bot.sendMessage(msg, msgArray);
        }
    },
   "hello": {
        description: "Gives a friendly greeting, including github link.",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Hello "+msg.sender+"! I'm DougleyBot, help me grow by contributing to my GitHub: https://github.com/SteamingMutt/DougleyBot");
        }
    },
    "server-info": {
        description: "Prints the information of the current server.",
        process: function(bot, msg, suffix) {
          // if we're not in a PM, return some info about the channel
		    if (msg.channel.server) {
              var msgArray = [];
                msgArray.push("You are currently in " + msg.channel + " (id: " + msg.channel.id + ")");
                msgArray.push("on server **" + msg.channel.server.name + "** (id: " + msg.channel.server.id + ") (region: " + msg.channel.server.region + ")");
                msgArray.push("owned by " + msg.channel.server.owner + " (id: " + msg.channel.server.owner.id + ")");
                if (msg.channel.topic) { msgArray.push("The current topic is: " + msg.channel.topic); }
                bot.sendMessage(msg, msgArray);
              }
      		else{
      			bot.sendMessage(msg, "This is a DM, there is no info.");
      		}
      	}
      },
    "birds":	{
    	 description: "What are birds?",
    	  process: function(bot,msg)	{
          var msgArray = [];
    		    msgArray.push("https://www.youtube.com/watch?v=Kh0Y2hVe_bw");
    		    msgArray.push("We just don't know");
            bot.sendMessage(msg, msgArray);
    	}
    },
    "game": {
        usage: "<name of game>",
        description: "Pings channel asking if anyone wants to play.",
        process: function(bot,msg,suffix){
            var game = game_abbreviations[suffix];
            if(!game) {
                game = suffix;
            }
            bot.sendMessage(msg.channel, "@everyone Anyone up for " + game + "?");
            console.log("Sent game invites for " + game);
        }
    },
    "servers": {
        description: "Lists servers bot is connected to.",
        adminOnly: true,
        process: function(bot,msg){bot.sendMessage(msg.channel,bot.servers);}
    },
    "channels": {
        description: "Lists channels bot is connected to.",
        adminOnly: true,
        process: function(bot,msg) { bot.sendMessage(msg.channel,bot.channels);}
    },
    "myid": {
        description: "Returns the user id of the sender.",
        process: function(bot,msg){bot.sendMessage(msg.channel,msg.author.id);}
    },
    "idle": {
        description: "Sets bot status to idle.",
        adminOnly: true,
        process: function(bot,msg){
          bot.setStatusIdle();
          console.log("My status has been changed to idle.");
        }
    },
    "killswitch": {
        description: "Kills all running instances of DougleyBot.",
        adminOnly: true,
        process: function(bot,msg){
          bot.sendMessage(msg.channel,"An admin has requested to kill all instances of DougleyBot, exiting...");
            console.log("Disconnected via killswitch!");
            process.exit(0);} //exit node.js without an error
    },
    "kappa": {
        description: "Kappa all day long!",
        process: function(bot, msg, suffix) {
          bot.sendFile(msg.channel, "./images/kappa.png");
          var bot_permissions = msg.channel.permissionsOf(bot.user);
          if (bot_permissions.hasPermission("manageMessages")){
            bot.deleteMessage(msg);
            return;
        } else {
         bot.sendMessage(msg.channel, "*This works best when I have the permission to delete messages!*");
       }
      }
    },
    "iff": {
        description: "Send an image from the ./images/ directory!",
        usage: "[image name] -ext",
        process: function(bot, msg, suffix) {
          var fs = require("fs");
          var path = require("path");
          var imgArray = [];
          fs.readdir(imgDirectory, function(err, dirContents) {
                  for (var i = 0; i < dirContents.length; i++){
                    for (var o = 0; o < ext.length; o++){
                      if (path.extname(dirContents[i]) === ext[o]){
                        imgArray.push(dirContents[i]);
                      }
                    }
                  }
                  if (imgArray.indexOf(suffix) !== -1){
                  bot.sendFile(msg.channel, "./images/"+suffix);
                  var bot_permissions = msg.channel.permissionsOf(bot.user);
                  if (bot_permissions.hasPermission("manageMessages")){
                    bot.deleteMessage(msg);
                    return;
                } else {
                 bot.sendMessage(msg.channel, "*This works best when I have the permission to delete messages!*");
               }
             } else {
               bot.sendMessage(msg.channel, "*Invalid input!*");
             }
           });
         }
    },
    "imglist": {
        description: "List's ./images/ dir!",
        process: function(bot, msg, suffix) {
          var fs = require("fs");
          var path = require("path");
          var imgArray = [];
          fs.readdir(imgDirectory, function(err, dirContents) {
                  for (var i = 0; i < dirContents.length; i++){
                    for (var o = 0; o < ext.length; o++){
                      if (path.extname(dirContents[i]) === ext[o]){
                        imgArray.push(dirContents[i]);
                      }
                    }
                  }
                  bot.sendMessage(msg.channel,imgArray);
          });
      }
    },
    "leave": {
        description: "Asks the bot to leave the current server.",
        process: function(bot, msg, suffix) {
          if (msg.channel.server) {
            if (msg.channel.permissionsOf(msg.sender).hasPermission("manageServer")){
              bot.sendMessage(msg.channel, "Alright, see ya!");
              bot.leaveServer(msg.channel.server);
              console.log("I've left a server on request of " + msg.sender.username + ", I'm only in " + bot.servers.length + " servers now.");
              return;
            } else {
              bot.sendMessage(msg.channel, "Can't tell me what to do. (Your role in this server needs the permission to manage the server to use this command.)");
              console.log("A non-privileged user (" + msg.sender.username + ") tried to make me leave a server.");
              return;
          }} else {
              bot.sendMessage(msg.channel, "I can't leave a DM, dummy!");
              return;
            }
        }
    },
    "online": {
        description: "Sets bot status to online.",
        adminOnly: true,
        process: function(bot,msg){
          bot.setStatusOnline();
          console.log("My status has been changed to online.");
        }
    },
    "youtube": {
        usage: "<video tags>",
        description: "Gets a Youtube video matching given tags.",
        process: function(bot,msg,suffix){
            youtube_plugin.respond(suffix,msg.channel,bot);
        }
    },
    "say": {
            usage: "<text>",
            description: "Copies text, and repeats it as the bot.",
            process: function(bot,msg,suffix){
              var bot_permissions = msg.channel.permissionsOf(bot.user);
              if (suffix.search("!say") === -1){
                bot.sendMessage(msg.channel,suffix,true);
                   if (bot_permissions.hasPermission("manageMessages")){
                     bot.deleteMessage(msg);
                     return;
                 } else {
                  bot.sendMessage(msg.channel, "*This works best when I have the permission to delete messages!*");
            }} else {
                bot.sendMessage(msg.channel,"HEY "+msg.sender+" STOP THAT!",true);
              }
            }
        },
    "refresh": {
        description: "Refreshes the game status.",
        process: function(bot,msg){
          bot.sendMessage(msg.channel,"I'm refreshing my playing status.");
          bot.setPlayingGame(Math.floor(Math.random() * (max - min)) + min);
          console.log("The playing status has been refreshed");
            }
        },
    "image": {
        usage: "<image tags>",
        description: "Gets image matching tags from Google.",
        process: function(bot,msg,suffix){
           google_image_plugin.respond(suffix,msg.channel,bot);
           console.log("I've looked for images of " + suffix + " for " + msg.sender.username);
         }
    },
    "pullanddeploy": {
        description: "Bot will perform a git pull master and restart with the new code.",
        adminOnly: true,
        process: function(bot,msg,suffix) {
            bot.sendMessage(msg.channel,"fetching updates...",function(error,sentMsg){
                console.log("updating...");
	            var spawn = require('child_process').spawn;
                var log = function(err,stdout,stderr){
                    if(stdout){console.log(stdout);}
                    if(stderr){console.log(stderr);}
                };
                var fetch = spawn('git', ['fetch']);
                fetch.stdout.on('data',function(data){
                    console.log(data.toString());
                });
                fetch.on("close",function(code){
                    var reset = spawn('git', ['reset','--hard','origin/master']);
                    reset.stdout.on('data',function(data){
                        console.log(data.toString());
                    });
                    reset.on("close",function(code){
                        var npm = spawn('npm', ['install']);
                        npm.stdout.on('data',function(data){
                            console.log(data.toString());
                        });
                        npm.on("close",function(code){
                            console.log("goodbye");
                            bot.sendMessage(msg.channel,"brb!",function(){
                                bot.logout(function(){
                                    process.exit();
                                });
                            });
                        });
                    });
                });
            });
        }
    },
    "meme": {
        usage: 'meme "top text" "bottom text"',
        process: function(bot,msg,suffix) {
            var tags = msg.content.split('"');
            var memetype = tags[0].split(" ")[1];
            //bot.sendMessage(msg.channel,tags);
            var Imgflipper = require("imgflipper");
            var imgflipper = new Imgflipper(ConfigFile.imgflip_username, ConfigFile.imgflip_password);
            imgflipper.generateMeme(meme[memetype], tags[1]?tags[1]:"", tags[3]?tags[3]:"", function(err, image){
                //console.log(arguments);
                bot.sendMessage(msg.channel,image);
                var bot_permissions = msg.channel.permissionsOf(bot.user);
                if (bot_permissions.hasPermission("manageMessages")){
                  bot.deleteMessage(msg);
                  return;
              } else {
               bot.sendMessage(msg.channel, "*This works best when I have the permission to delete messages!*");
            }});
        }
    },
    "memehelp": { //TODO: this should be handled by !help
        description: "Returns available memes for !meme.",
        process: function(bot,msg) {
            var str = "Currently available memes:\n";
            for (var m in meme){
                str += m + "\n";
            }
            bot.sendMessage(msg.channel,str);
        }
    },
    "log": {
        usage: '<log message>',
        description: 'Logs a message to the console.',
        adminOnly: true,
        process: function(bot, msg, suffix) {
            console.log(msg.content);
        }
    },
    "wiki": {
        usage: "<search terms>",
        description: "Returns the summary of the first matching search result from Wikipedia.",
        timeout: 10, // In seconds
        process: function(bot,msg,suffix) {
            var query = suffix;
            if(!query) {
                bot.sendMessage(msg.channel,"usage: !wiki search terms");
                return;
            }
            var Wiki = require('wikijs');
            new Wiki().search(query,1).then(function(data) {
                new Wiki().page(data.results[0]).then(function(page) {
                    page.summary().then(function(summary) {
                        var sumText = summary.toString().split('\n');
                        var continuation = function() {
                            var paragraph = sumText.shift();
                            if(paragraph){
                                bot.sendMessage(msg.channel,paragraph,continuation);
                            }
                        };
                        continuation();
                    });
                });
            },function(err){
                bot.sendMessage(msg.channel,err);
            });
        }
    },
    "join-server": {
        usage: "<bot-username> <instant-invite>",
        description: "Joins the server it's invited to.",
        process: function(bot,msg,suffix) {
          suffix = suffix.split(" ");
          if (suffix[0] === bot.user.username) {
            console.log(bot.joinServer(suffix[1],function(error,server) {
                console.log("callback: " + arguments);
                if(error){
                    bot.sendMessage(msg.channel,"failed to join: " + error);
                } else {
                    console.log("Joined server " + server);
                    bot.sendMessage(msg.channel,"Successfully joined " + server);
                }
            }));
          } else {console.log("Ignoring join command meant for another bot.");}
        }
    },
    "stock": {
        usage: "<stock to fetch>",
        process: function(bot,msg,suffix) {
            var yahooFinance = require('yahoo-finance');
            yahooFinance.snapshot({
              symbol: suffix,
              fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
            }, function (error, snapshot) {
                if(error){
                    bot.sendMessage(msg.channel,"couldn't get stock: " + error);
                } else {
                    //bot.sendMessage(msg.channel,JSON.stringify(snapshot));
                    bot.sendMessage(msg.channel,snapshot.name + "\nprice: $" + snapshot.lastTradePriceOnly);
                }
            });
        }
    },
    "rss": {
        description: "Lists available rss feeds",
        process: function(bot,msg,suffix) {
            /*var args = suffix.split(" ");
            var count = args.shift();
            var url = args.join(" ");
            rssfeed(bot,msg,url,count,full);*/
            bot.sendMessage(msg.channel,"Available feeds:", function(){
                for(var c in rssFeeds){
                    bot.sendMessage(msg.channel,c + ": " + rssFeeds[c].url);
                }
            });
        }
    },
    "reddit": {
        usage: "[subreddit]",
        description: "Returns the top post on reddit. Can optionally pass a subreddit to get the top post there instead",
        process: function(bot,msg,suffix) {
            var path = "/.rss";
            if(suffix){
                path = "/r/"+suffix+path;
            }
            rssfeed(bot,msg,"https://www.reddit.com"+path,1,false);
        }
    },
    "stroke": {
      usage: "[First name][, [Last name]]",
      description: "Stroke someone's ego, best to use first and last name or split the name!",
      process: function(bot,msg,suffix) {
        var name;
        if (suffix){
        name = suffix.split(" ");
          if (name.length === 1) {name = ["",name];}
      } else {name = ["Perpetu","Cake"];}
        var request = require('request');
        request('http://api.icndb.com/jokes/random?escape=javascript&firstName='+name[0]+'&lastName='+name[1], function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var joke = JSON.parse(body);
            bot.sendMessage(msg.channel,joke.value.joke);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "yomomma": {
      description: "Returns a random Yo momma joke.",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('http://api.yomomma.info/', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var yomomma = JSON.parse(body);
            bot.sendMessage(msg.channel,yomomma.joke);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "advice": {
      description: "Gives you good advice!",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('http://api.adviceslip.com/advice', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var advice = JSON.parse(body);
            bot.sendMessage(msg.channel,advice.slip.advice);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "yesno": {
      description: "Answer yes or no with a gif (or randomly choose one!)",
      usage :"optional: [force yes/no/maybe]",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('http://yesno.wtf/api/?force='+suffix, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var yesNo = JSON.parse(body);
            bot.sendMessage(msg.channel,msg.sender+" "+yesNo.image);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    //This command needs cleaning. Very badly. But it works well, so whatever. <3 xkcd
    "xkcd": {
      description: "Returns a random (or chosen) xkcd comic",
      usage :"[current, or comic number]",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('http://xkcd.com/info.0.json', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var xkcdInfo = JSON.parse(body);
              if (suffix) {
                var isnum = /^\d+$/.test(suffix);
                if (isnum) {
                  if ([suffix] < xkcdInfo.num){
                  request('http://xkcd.com/'+suffix+'/info.0.json', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                      xkcdInfo = JSON.parse(body);
                      bot.sendMessage(msg.channel,xkcdInfo.img);
                    } else {
                      console.log("Got an error: ", error, ", status code: ", response.statusCode);
                    }
                  });
                } else {bot.sendMessage(msg.channel,"There are only "+xkcdInfo.num+" xkcd comics!");}
              } else {
                bot.sendMessage(msg.channel,xkcdInfo.img);
              }
              } else {
                var xkcdRandom = Math.floor(Math.random() * (xkcdInfo.num - 1)) + 1;
                request('http://xkcd.com/'+xkcdRandom+'/info.0.json', function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    xkcdInfo = JSON.parse(body);
                    bot.sendMessage(msg.channel,xkcdInfo.img);
                  } else {
                    console.log("Got an error: ", error, ", status code: ", response.statusCode);
                  }
                });
              }

          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "8ball": {
      description: "Makes executive decisions super easy!",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('https://8ball.delegator.com/magic/JSON/0', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var eightBall = JSON.parse(body);
            bot.sendMessage(msg.channel,eightBall.magic.answer+", "+msg.sender);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "catfacts": {
      description: "Returns cool facts about cats!",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('http://catfacts-api.appspot.com/api/facts', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var catFact = JSON.parse(body);
            bot.sendMessage(msg.channel,catFact.facts[0]);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "fact": {
      description: "Returns a random fact!",
      process: function(bot,msg,suffix) {
        var request = require('request');
        var xml2js = require('xml2js');
        request("http://www.fayd.org/api/fact.xml", function (error, response, body) {
          if (!error && response.statusCode == 200) {
            //console.log(body)
            xml2js.parseString(body, function (err, result) {
              bot.sendMessage(msg.channel,result.facts.fact[0]);
            });
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        }
      );
      }
    },
    "csgoprice": {
      description: "Gives the price of a CSGO skin. Very picky regarding capitalization and punctuation.",
      usage: '[weapon "AK-47"] [skin "Vulcan"] [[wear "Factory New"] [stattrak "(boolean)"]] Quotes are important!',
      process: function(bot,msg,suffix) {
        skinInfo = suffix.split('"');
        var csgomarket = require('csgo-market');
        csgomarket.getSinglePrice(skinInfo[1],skinInfo[3],skinInfo[5],skinInfo[7], function (err, skinData) {
          if (err) {
            console.error('ERROR', err);
            bot.sendMessage(msg.channel,"That skin doesn't exist!");
          } else {
            if (skinData.success === true) {
              if (skinData.stattrak){skinData.stattrak = "Stattrak";} else {skinData.stattrak = "";}
            var msgArray = ["Weapon: "+skinData.wep+" "+skinData.skin+" "+skinData.wear+" "+skinData.stattrak,"Lowest Price: "+skinData.lowest_price,"Number Available: "+skinData.volume,"Median Price: "+skinData.median_price,];
            bot.sendMessage(msg.channel,msgArray);
            }
          }
        });
      }
    },
    "dice": {
      usage: "[numberofdice]d[sidesofdice]",
      description: "Dice roller yay!",
      process: function(bot,msg,suffix) {
        var dice;
        if (suffix){
            dice = suffix;
      } else {dice = "d6";}
        var request = require('request');
        request('https://rolz.org/api/?'+dice+'.json', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var roll = JSON.parse(body);
            bot.sendMessage(msg.channel,"Your "+roll.input+" resulted in "+roll.result+" "+roll.details);
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "imdb": {
      usage: "[title]",
      description: "Returns information for an IMDB title",
      process: function(bot,msg,suffix) {
        if (suffix) {
        var request = require('request');
        request('http://api.myapifilms.com/imdb/title?format=json&title='+suffix+'&token='+ConfigFile.myapifilms_token, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var imdbInfo = JSON.parse(body);
            imdbInfo = imdbInfo.data.movies[0];
                if (imdbInfo) {
            //Date snatching
            var y = imdbInfo.releaseDate.substr(0,4),
            m = imdbInfo.releaseDate.substr(4,2),
            d = imdbInfo.releaseDate.substr(6,2);
            var msgArray = [imdbInfo.title,imdbInfo.plot," ","Released on: "+m+"/"+d+"/"+y,"Rated: "+imdbInfo.rated];
                    var sendArray = [imdbInfo.urlIMDB,msgArray];
                    for (var i = 0; i < sendArray.length; i++) {
                      bot.sendMessage(msg.channel,sendArray[i]);
                    }
                }else {
                bot.sendMessage(msg.channel,"Search for "+suffix+" failed!");
          }
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      } else {
        bot.sendMessage(msg.channel,"Usage: !imdb [title]");
      }
      }
    },
    "fancyinsult": {
      description: "Insult your friends, in style.",
      process: function(bot,msg,suffix) {
        var request = require('request');
        request('http://quandyfactory.com/insult/json/', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var fancyinsult = JSON.parse(body);
      if (suffix === "")  {
        bot.sendMessage(msg.channel,fancyinsult.insult);
	bot.deleteMessage(msg);
      }
      else {
        bot.sendMessage(msg.channel,suffix+", "+fancyinsult.insult);
	bot.deleteMessage(msg);
      }
          } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode);
          }
        });
      }
    },
    "alias": {
      usage: "<aliasname> <actual command> (without cmdPrefix)",
      description: "Creates command aliases. Useful for making simple commands on the fly",
      adminOnly: true,
      process: function(bot,msg,suffix) {
        var args = suffix.split(" ");
        var name = args.shift();
        if(!name){
          bot.sendMessage(msg.channel,cmdPrefix+"alias " + this.usage + "\n" + this.description);
        } else if(commands[name] || name === "help"){
          bot.sendMessage(msg.channel,"overwriting commands with aliases is not allowed!");
        } else {
          var command = args.shift();
          aliases[name] = [command, args.join(" ")];
          //now save the new alias
          require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
          bot.sendMessage(msg.channel,"created alias " + name);
        }
      }
    }
};

/*
========================
RRS feed fetcher.

This will fetch the RSS feeds defined in rss.json.
========================
*/

try{
var rssFeeds = require("./runtime/rss.json");
function loadFeeds(){
    for(var cmd in rssFeeds){
        commands[cmd] = {
            usage: "[count]",
            description: rssFeeds[cmd].description,
            url: rssFeeds[cmd].url,
            process: function(bot,msg,suffix){
                var count = 1;
                if(suffix !== null && suffix !== "" && !isNaN(suffix)){
                    count = suffix;
                }
                rssfeed(bot,msg,this.url,count,false);
            }
        };
    }
}
} catch(e) {
    console.log("Couldn't load rss.json. See rss.json.example if you want rss feed commands. error: " + e);
}

try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

function rssfeed(bot,msg,url,count,full){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
        bot.sendMessage(msg.channel,"failed reading feed: " + error);
    });
    var shown = 0;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1;
        if(shown > count){
            return;
        }
        var item = stream.read();
        bot.sendMessage(msg.channel,item.title + " - " + item.link, function() {
            if(full === true){
                var text = htmlToText.fromString(item.description,{
                    wordwrap:false,
                    ignoreHref:true
                });
                bot.sendMessage(msg.channel,text);
            }
        });
        stream.alreadyRead = true;
    });
}


var bot = new Discord.Client();

/*
========================
When all commands are loaded, start the connection to Discord!
========================
*/

bot.on("ready", function () {
    loadFeeds();
    console.log("Initializing...");
    console.log("Checking for updates...");
    VersionChecker.getStatus(function(err, status) {
      if (err) { error(err); } // error handle
      if (status && status !== "failed") {
        console.log(status);
      }
    });
  bot.joinServer(ConfigFile.join_servers_on_startup);
  console.log("I've joined the servers defined in my config file.");
	console.log("Ready to begin! Serving in " + bot.channels.length + " channels");
  bot.setPlayingGame(Math.floor(Math.random() * (max - min)) + min);
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); // exit node.js with an error

});
/*
========================
Command interpeter.

This will check if given message will correspond to a command defined in the command variable.
This will work, so long as the bot isn't overloaded or still busy.
========================
*/
bot.on("message", function (msg) {
  if(msg.author != bot.user && msg.isMentioned(bot.user)){
    Cleverbot.prepare(function(){
      bot.startTyping(msg.channel);
          cleverbot.write(msg.content, function (response) {
               bot.sendMessage(msg.channel, response.message);
               bot.stopTyping(msg.channel);
             });
          });
        }
	// check if message is a command
	if(msg.author.id != bot.user.id && (msg.content[0] === cmdPrefix)){
        if(msg.author.equals(bot.user)) { return; }
        if (maintenance == "true") {
          bot.sendMessage(msg.channel, "Hey "+msg.sender + ", I'm in maintenance mode, I can't take commands right now.");
          return;}
        console.log("Message recieved, I'm interpeting |" + msg.content + "| from " + msg.author.username + " as an command");
    var cmdTxt = msg.content.split(" ")[0].substring(1).toLowerCase();
        var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space

        alias = aliases[cmdTxt];
    		if(alias){
    			cmdTxt = alias[0];
    			suffix = alias[1] + " " + suffix;
    		}

		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
            bot.sendMessage(msg.channel, "Ok "+msg.sender+", I've send you a list of commands via DM.");
            for(cmd in commands) {
                var info = cmdPrefix + cmd;
                var usage = commands[cmd].usage;
                if(usage){
                    info += " " + usage;
                }
                var description = commands[cmd].description;
                if(description){
                    info += "\n\t" + description;
                }
                var msgArray = [];
                  msgArray.push("```");
                  msgArray.push(info);
                  msgArray.push("```");
                  bot.sendMessage(msg.author,msgArray);
            }
        }
		else if(cmd) {
            var cmdCheckSpec = canProcessCmd(cmd, cmdTxt, msg.author.id, msg);
			if(cmdCheckSpec.isAllow) {
				cmd.process(bot,msg,suffix);
			}
		} else {
			bot.sendMessage(msg.channel, "Hey "+msg.sender+", you've used an invalid command!");
		}
  }
});

/*
========================
Logger for status changes.

Feature disabled for being unneeded.
========================


//Log user status changes
bot.on("presence", function(data) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(data.user+" went "+data.status);
	//}
});

function isInt(value) {
  return !isNaN(value) &&
         parseInt(Number(value)) == value &&
         !isNaN(parseInt(value, 10));
}
*/

/*
========================
Permission/cooldown checker.

This will check if the user has permission to execute the given command, or if the command is on cooldown.
When there are no permissions, or the command is on cooldown, don't execute the command.
========================
*/

function canProcessCmd(cmd, cmdText, userId, msg) {
	var isAllowResult = true;
	var errorMessage = "";

	if (cmd.hasOwnProperty("timeout")) {
		// check for timeout
		if(cmdLastExecutedTime.hasOwnProperty(cmdText)) {
			var currentDateTime = new Date();
			var lastExecutedTime = new Date(cmdLastExecutedTime[cmdText]);
			lastExecutedTime.setSeconds(lastExecutedTime.getSeconds() + cmd.timeout);

			if(currentDateTime < lastExecutedTime) {
				// still on cooldown
				isAllowResult = false;
				//var diff = (lastExecutedTime-currentDateTime)/1000;
				//errorMessage = diff + " secs remaining";
                bot.sendMessage(msg.channel, "Hey "+msg.sender+", this command is on cooldown!");
			}
			else {
				// update last executed date time
				cmdLastExecutedTime[cmdText] = new Date();
			}
		}
		else {
			// first time executing, add to last executed time
			cmdLastExecutedTime[cmdText] = new Date();
		}
	}

	if (cmd.hasOwnProperty("adminOnly") && cmd.adminOnly && !isAdmin(userId)) {
		isAllowResult = false;
        bot.sendMessage(msg.channel, "Hey "+msg.sender+", you are not allowed to do that!");
	}

	return { isAllow: isAllowResult, errMsg: errorMessage };
}

function isAdmin(id) {
  return (admin_ids.indexOf(id) > -1);
}

function get_gif(tags, func) {
        //limit=1 will only return 1 gif
        var params = {
            "api_key": config.api_key,
            "rating": config.rating,
            "format": "json",
            "limit": 1
        };
        var query = qs.stringify(params);

        if (tags !== null) {
            query += "&q=" + tags.join('+');
        }

        //wouldnt see request lib if defined at the top for some reason:\
        var request = require("request");
        //console.log(query)

        request(config.url + "?" + query, function (error, response, body) {
            //console.log(arguments)
            if (error || response.statusCode !== 200) {
                console.error("giphy: Got error: " + body);
                console.log(error);
                //console.log(response)
            }
            else {
                var responseObj = JSON.parse(body);
                console.log(responseObj.data[0]);
                if(responseObj.data.length){
                    func(responseObj.data[0].id);
                } else {
                    func(undefined);
                }
            }
        }.bind(this));
    }

bot.login(ConfigFile.discord_email, ConfigFile.discord_password);
