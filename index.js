#!/usr/bin/env node

const fs = require('fs');
const child_process = require('child_process');
const enquirer = require('enquirer');

// const PLUGIN = "stillworking"
// const VERSION = "1.1.0"

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
  fs.writeFileSync(fname + '.tmp', activities.join("\n"));
  fs.copyFile(fname + '.tmp', fname, () => {});
}

const projects = () =>
  Object.keys(
    activities
      .map(a => a.split(':')[0])
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

const NOT_WORKING = '- I am not working'

// prompt "Question" "Default value"
async function applePrompt() {
  try {
    const lastValue = activities[0] || 'fovea:accounting';
    const ret = await (new enquirer.AutoComplete({
      message: 'What are you working on?',
      limit: 10,
      choices: [
        lastValue,
        NOT_WORKING,
        '+ Other',
        ...activities.slice(1)
      ],
      suggest (input, choices) {
        const str = input.toLowerCase();
        const ret = choices.filter(ch => ch.message.toLowerCase().includes(str));
        if (ret.length === 0)
          return [{message: '+ Other', value: '+ Other'}];
        return ret;
      }
    })).run();
    if (ret === '+ Other') {
      const project = await (new enquirer.Input({
        message: 'Project?',
        initial: lastValue.split(':')[0]
      })).run();
      const activity = await (new enquirer.Input({
        message: 'Activity?',
        initial: lastValue.split(':').slice(1).join(':')
      })).run();
      if (!project || !activity) {
        return await applePrompt();
      }
      else {
        const ret = project + ':' + activity;
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
      return ret;
    }
  }
  catch (e) {
    return await applePrompt();
  }
}

async function main() {
  const value = await applePrompt();
  // if (value) {
  //   const project = value.split(':')[0];
  //   const entity = value.split(':').slice(1).join(':');
  //   const cmd = `wakatime --write --plugin "${PLUGIN}/${VERSION}" --entity-type app --project "${project}" --entity "${entity}"`;
  //   const res = await exec(cmd);
  //   console.log(res.stdout);
  // }
  fs.writeFileSync('/tmp/stillworking-wakatime.out', value || '');
}

main();

/*
async function prompt() {
  has_response=NO
  while [ $has_response = NO ]; do
    t0="$(gdate +%s%3N)"
    ret="$(applePrompt "$1" "$2")"
    t1="$(gdate +%s%3N)"

    # If the prompt is exited too fast, it means the user was
    # probably hitting enter/escape for another reason.
    # We'll ask again.
    if [ $((t1 - t0)) -ge 1000 ]; then
      has_response=YES
    fi
  done
  echo "$ret"
}

while true; do
  if prompt "What are you working on?" "$LAST_PROJECT" | tee ~/.stillworking; then
    NEW_PROJECT="$(cat ~/.stillworking)"
    if [ ! -z "$NEW_PROJECT" ]; then
      PROJECT="$(echo "$NEW_PROJECT" | cut -d: -f1)"
      ENTITY="$(echo "$NEW_PROJECT" | cut -d: -f2-)"
      if [ -z "$ENTITY" ]; then
        ENTITY="$PROJECT"
      fi
      wakatime --write --plugin "$PLUGIN/$VERSION" --entity-type app --project "$PROJECT" --entity "$ENTITY"
      LAST_PROJECT="$NEW_PROJECT"
    fi
  fi
  sleep $((14 * 60)) # every 14 minutes (wakatime timeout is 15 minutes)
done
*/
