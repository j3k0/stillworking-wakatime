#!/usr/bin/env node

const fs = require('fs');
const child_process = require('child_process');
const enquirer = require('enquirer');
const SEPARATOR = ';';

let activities = fs
  .readFileSync(process.env.HOME + '/.stillworking', 'utf-8')
  .split("\n");

function rememberActivity(r) {
  const i = activities.indexOf(r);
  if (i >= 0) {
    // Push the activity on top
    activities =
      [activities[i]]
      .concat(
        activities.slice(0, i),
        activities.slice(i + 1)
      );
  }
  else {
    activities.unshift(r);
  }
  // reduce risk of corruption by first writing to a temporary file
  const fname = process.env.HOME + '/.stillworking';
  fs.copyFileSync(fname, fname + '.bak');
  fs.writeFileSync(fname + '.tmp', activities.join("\n"));
  fs.renameSync(fname + '.tmp', fname);
}

const projects = () =>
  Object.keys(
    activities
      .map(a => a.split(SEPARATOR)[0])
      .reduce((obj, proj) => {
        obj[proj] = 1;
        return obj;
      }, {})
  );

const exec = (cmd) => {
  return new Promise(resolve => {
    const exec = child_process.exec;
    exec(cmd, {maxBuffer: 1024 * 1024 * 5}, (err, stdout, stderr) => {
      if (err) {
        // if (stdout) console.log(stdout);
        // if (stderr) console.log(stderr);
        // console.log(err);
        process.exit(1);
      }
      resolve({err, stdout, stderr});
    });
  });
};

const NOT_WORKING = '- I am not working';
const OTHER = '+ Other';

// prompt "Question" "Default value"
async function applePrompt() {
  try {
    const lastValue = activities[0] || OTHER;
    const ret = await (new enquirer.AutoComplete({
      message: 'What are you working on?',
      limit: 10,
      choices: [
        '',
        lastValue,
        NOT_WORKING,
        OTHER,
        ...activities.slice(1)
      ],
      suggest (input, choices) {
        const str = input.toLowerCase();
        const ret = choices.filter(ch => ch.message.toLowerCase().includes(str));
        if (ret.length === 0)
          return [{message: OTHER, value: OTHER}];
        return ret;
      }
    })).run();
    if (ret === OTHER) {
      const project = await (new enquirer.Input({
        message: 'Project?',
        initial: lastValue.split(SEPARATOR)[0]
      })).run();
      const activity = await (new enquirer.Input({
        message: 'Activity?',
        initial: lastValue.split(SEPARATOR).slice(1).join(SEPARATOR)
      })).run();
      if (!project || !activity) {
        return await applePrompt();
      }
      else {
        const ret = project + SEPARATOR + activity.replace(new RegExp(SEPARATOR, 'g'), ':');
        rememberActivity(ret);
        return ret;
      }
    }
    else if (ret === NOT_WORKING) {
      return '';
    }
    else if (!ret) {
      return await applePrompt();
    }
    else {
      rememberActivity(ret);
      return ret;
    }
  }
  catch (e) {
    return await applePrompt();
  }
}

async function main() {
  const value = await applePrompt();
  fs.writeFileSync('/tmp/stillworking-wakatime.out', value || '');
}

main();

