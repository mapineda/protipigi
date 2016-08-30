var fs = require('fs');

var Train = require('./src/train');
var Brain = require('./src/brain');
var Ears = require('./src/ears');
var builtinPhrases = require('./builtins');

var Mercury = {
  Brain: new Brain(),
  Ears: new Ears(process.env.SLACK_TOKEN)
};

var customPhrasesText;
var customPhrases;
try {
  customPhrasesText = fs.readFileSync(_dirname + '/custom-phrases.json').toString();
} catch (err) {
  throw new Error('Uh oh, Mercury could not find the' + 'custom-phrases.json file, did you move it?');
}
try {
  customPhrases = JSON.parse(customPhrasesText);
} catch (err) {
  throw new Error('Uh oh, custom-phrases.json was' + 'not valid JSON! fix it, please? =]');
}

console.log('Mercury is learning...');
Mercury.Teach = Mercury.Brain.teach.bind(Mercury.Brain);
eachKey(customPhrases, Mercury.Teach);
eachKey(builtinPhrases, Mercury.Teach);
Mercury.Brain.think();
console.log('Mercury finished learning, time to listen...');
Mercury.Ears
  .listen()
  .hear('TRAINING TIME!', function(speech, message) {
    console.log('Delegating to on-the-fly training module...');
    Train(Mercury.Brain, speech, message);
  })
  .hear('.*', function(speech, message) {
    var interpretation = Mercury.Brain.interpret(message.text);
    console.log('Mercury heard: ' + message.text);
    console.log('Mercury interpretation: ' + interpretation);
    if (interpretation.guess) {
      console.log('Invoking skill: ' + interpretation.guess);
      Mercury.Brain.invoke(interpretation.guess, interpretation, speech, message);
    } else {
      speech.reply(message, 'Hmm... I couldn\'t tell what you said..');
      speech.reply(message, '```\n' + JSON.stringify(interpretation) + '\n```');
    }
  });
