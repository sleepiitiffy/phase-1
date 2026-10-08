# p5 Phone Agent Start

A starting point for p5.js sketches on your phone, set up for working with a coding agent: OpenCode, or the Chat in VS Code.

It has everything in the simple starter (`index.html`, `sketch.js`, the skills), plus four things for working with an agent: notes the agent reads every session, a plan you fill in, a folder for your references, and a command that shows your sketch on your phone without pushing.

## What is in it

| File | What it does | Who writes it |
|---|---|---|
| `index.html` | Loads p5.js 2, p5-phone and your sketch. | Nobody, most of the time |
| `sketch.js` | Your sketch. | You and the agent |
| `plan.md` | What you want, and the steps to get there. | You, above Steps. The agent writes the Steps. |
| `references/` | The images your plan points to: layouts, inspiration, example code. | You |
| `AGENTS.md` | Notes the agent reads at the start of every session. | You. Change it as you learn how you like to work. |
| `.agents/skills/` | Two skills: how p5-phone works, and how to write p5.js 2. | Leave them as they are |
| `package.json`, `scripts/phone.mjs` | The phone command, `npm run phone`. | Leave them as they are |
| `README.md` | This page. | You, if you like |
| `.nojekyll`, `.gitignore`, `.vscode/` | Small settings for GitHub Pages, Git and VS Code. | Leave them as they are |

Files and folders that start with a dot are hidden in Finder and File Explorer. VS Code and GitHub show them.

## Use it

The full walkthrough with screenshots is here:
https://digitalfuturesocadu.github.io/vsCodeSetup/guide/

The short version:

1. Click **Use this template**, then **Create a new repository**. Keep it **Public**.
2. In your new repository, open **Settings**, then **Pages**. Under **Build and deployment**, leave **Source** on **Deploy from a branch**. Set **Branch** to **main** and the folder to **/ (root)**, then click **Save**. After that, every push publishes your sketch.
3. Clone it to your laptop, into `Documents/GitHub`. With GitHub Desktop: on your repository's page, click **Code**, then **Open with GitHub Desktop**, then **Clone**. Or in VS Code: choose **Clone Git Repository**, then **Clone from GitHub**, and pick your new repository.
4. Open `index.html` and click **Go Live** to see the sketch on your laptop.
5. Change `sketch.js`. In Source Control, write a message, click **Commit**, then **Sync Changes**.
6. Wait about a minute. Open this address on your phone:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

GitHub does not copy the Pages setting from the template, so each new copy needs step 2 once. Until then, your address shows a 404. You do not need GitHub Actions, and you do not need the **Configure** button.

## Plan it in a chat

A chat is a good place to make your plan: a strong free model (Claude's free plan has Sonnet 5.5), your voice, your images, and as long as you need. It cannot see this repo, so the prompt gives it the two skills and the plan template as links. What comes back here is `plan.md` and your images.

1. Open a new chat. Attach your images, if you have any. Send this, with your own idea on the last line but one:

```
I'm designing a phone sketch for a design class. The goal of this chat is one file, plan.md: a detailed plan that a coding agent in my repo will build from, one small step at a time, in p5.js 2 with the p5-phone library. I write the parts that describe my idea. You ask me questions, tell me what a phone can and cannot do, and at the end write the build steps for the agent. No code.

Read these first, so you know what the phone and the libraries can do, and what my plan needs:
- p5-phone skill: https://raw.githubusercontent.com/npuckett/p5-phone/main/SKILL.md
- p5.js 2 skill: https://raw.githubusercontent.com/DigitalFuturesOCADU/atelier1-f26-agentStart-p5/main/.agents/skills/p5js-2x/SKILL.md
- My plan template: https://raw.githubusercontent.com/DigitalFuturesOCADU/atelier1-f26-agentStart-p5/main/plan.md

My idea: [your idea, in one or two sentences]

Ask me questions, one at a time, until everything above Steps in the template is clear. Tell me when something I want is hard or impossible on a phone. Do not write my answers for me.
```

   With images, add before your idea: `I'm attaching [file]. It is a layout: match where things sit and their size. [file] is inspiration: take the feel only. Use these file names in the References table. They will be in the references folder in my repo.`

2. Answer its questions in your own words. When it has no more questions, it may offer `plan.md` as a file. If it does not, send this:

```
Now write my plan.md as a file I can download.
- Use my template's headings, in the same order.
- Above Steps, use my answers from this chat, in my own words. Do not rewrite them or add your own. If something is missing, leave its [brackets] for me to fill in.
- Then write the Steps for the coding agent. For each step: what to build, in a sentence or two; which p5-phone and p5.js functions to use, from the skills; what I should see on my laptop, and on my phone; any new numbers, named at the top of sketch.js so I can tune them.
- Keep each step small enough to check on my phone in a few minutes. Put the riskiest phone parts (permissions, sensors, keeping the screen on) early.
- After the Steps, list what you had to assume.
- Leave Changes empty. No code.
```

3. Download `plan.md` and put it at the top of this repo, next to `sketch.js`, in place of the template's. If the chat only shows text, copy it into `plan.md` instead. Put your images in `references/` with the same names.
4. Read everything above **Steps**. It should be your answers, in your own words: rewrite any line that is not, and fill in any `[brackets]` it left. The Steps can come from the chat. Commit, and keep the chat's link.
5. In OpenCode, choose **Plan** and send: `@plan.md Check the Steps against this project and its skills. What is wrong, missing or too big? Do not change any files.`
6. Switch to **Build** and send: `Make those changes to the Steps in plan.md. Change nothing else.` Commit.
7. Send `Do step 1.` Check it on your phone. When you change the plan later, commit, then tell Build: `I changed [what] in plan.md. Update step 1 to match.`

If the chat cannot open the links, save the three files and attach them instead.

## Or plan in your repo

1. Open `plan.md`. Fill in everything above **Steps** yourself. Rough notes are fine.
2. Put any images you mention in `references/`, and list them in the References table.
3. Commit.
4. In OpenCode, choose **Plan** and send:

```
@plan.md Read my plan and open each image in references. Write the Steps: small steps, each one I can check on my phone. Then list what you had to assume. Do not change any files.
```

5. Read the steps and cut them down. Anything it had to assume is a decision it made for you. If you care about one, add it to the top of your plan.
6. Plan cannot edit your files. Switch to **Build** and send: `Put those steps under Steps in plan.md. Change nothing else.` Commit.
7. Still in **Build**, send: `Do step 1.` Check it on your phone. Commit if you keep it.

If your plan is still thin, start with this in **Plan** instead:

```
@plan.md Read my plan. Ask me questions about anything that is unclear, one at a time, up to five. Do not write the steps yet. Do not change any files.
```

In VS Code's Chat the same steps work. Choose **Plan**, then **Agent**, and type `#` to point at `plan.md`.

## See it on your phone without pushing

`npm run phone` opens a temporary HTTPS address for this project and prints a QR code. Tilt, shake and sound work on the phone, and every save shows up when you reload.

It needs two installs, once. There is nothing to install with npm.

- **Node.js**, the LTS version from nodejs.org.
- **cloudflared**. Mac: `brew install cloudflared`. Windows: `winget install --id Cloudflare.cloudflared`.

Then, each time:

1. Open a terminal in this folder (in VS Code or OpenCode) and run `npm run phone`. If Live Server is running (**Go Live**, port 5500), it uses that. If not, it starts its own preview server for this folder.
2. Scan the QR code. Save a change, then reload on the phone. Press `Ctrl+C` to stop. The address changes next time.

Anyone with the address can open it while it runs. For anything you hand in or show, use Pages.

## Already have a repo?

If you made your repo from the simple starter, you can add these pieces to it. The prompt also brings your skills up to date. Commit first. Then open your project in OpenCode, choose **Build**, and paste:

```
Copy these from the template at github.com/DigitalFuturesOCADU/atelier1-f26-agentStart-p5 into this project: AGENTS.md, plan.md, the references folder, package.json, and the scripts folder. Replace the .agents/skills folder with the template's copy, so the skills are up to date. If this project already has a plan.md, keep mine and save the template's as plan-template.md. If any other file already exists here, do not replace it. Tell me instead. Do not change any of my other files, and do not commit. Then list what you added.
```

Look at what changed in the Review panel or in Source Control. Then commit. If you already had a plan, copy the headings you want from `plan-template.md` into it.

## If your page does not publish

Ask your coding agent. In OpenCode, or in VS Code's Chat set to **Agent**, open this project and paste the prompt below. It needs the GitHub CLI signed in first: run `gh auth login`.

```
Turn on GitHub Pages for this repo so it publishes from the main branch. Use the GitHub CLI. Run gh api -X POST "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/". If it says Pages is already enabled, run gh api -X PUT "repos/{owner}/{repo}/pages" -f build_type=legacy -f "source[branch]=main" -f "source[path]=/" instead. Then find the newest run with gh run list --limit 1, follow it with gh run watch and its ID, and when it finishes tell me the Pages address from gh api "repos/{owner}/{repo}/pages" --jq .html_url.
```

The same fix is in the setup guide, with a Copy button for the prompt: [Pages is not switched on](https://digitalfuturesocadu.github.io/vsCodeSetup/guide/#fix--pages-off).

## Skills for your coding agent

The `.agents/skills` folder holds two skills. A skill is a set of notes a coding agent reads when it needs them. OpenCode and the Chat in VS Code both look in this folder.

- `p5-phone` explains how p5-phone reaches the phone's sensors and asks for permissions.
- `p5js-2x` keeps the agent writing p5.js 2.x code, not the older 1.x code most models learned from.

`AGENTS.md` asks the agent to load both before it starts. They come from the [p5-phone repository](https://github.com/npuckett/p5-phone). Leave them as they are for now. When they are fixed there, the prompt under **Already have a repo?** copies the new ones into your project. You can add your own skills next to them later.
